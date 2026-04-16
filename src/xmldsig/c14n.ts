/**
 * XML Canonicalization 1.0 (C14N)
 * http://www.w3.org/TR/2001/REC-xml-c14n-20010315
 *
 * DOMParser ベースの実装。e-Gov XML-DSig 署名に必要な範囲のみ対応。
 */

const XML_NS = 'http://www.w3.org/2000/xmlns/'

/**
 * XML文字列全体を正規化する
 */
export function canonicalize(xmlString: string): string {
  const parser = new DOMParser()
  const doc = parser.parseFromString(xmlString, 'application/xml')
  const error = doc.querySelector('parsererror')
  if (error) {
    throw new Error(`XML parse error: ${error.textContent}`)
  }
  return serializeNode(doc.documentElement, new Map())
}

/**
 * XML文字列内の特定 ID 属性を持つ要素を正規化する
 * URI="#構成情報" のような same-document reference 用
 */
export function canonicalizeById(xmlString: string, id: string): string {
  const parser = new DOMParser()
  const doc = parser.parseFromString(xmlString, 'application/xml')
  const error = doc.querySelector('parsererror')
  if (error) {
    throw new Error(`XML parse error: ${error.textContent}`)
  }

  const element = findElementById(doc.documentElement, id)
  if (!element) {
    throw new Error(`Element with ID="${id}" not found`)
  }

  // 祖先の名前空間宣言を収集（C14N では in-scope namespace が必要）
  const inheritedNs = collectAncestorNamespaces(element)
  return serializeNode(element, inheritedNs)
}

function findElementById(element: Element, id: string): Element | null {
  if (element.getAttribute('ID') === id || element.getAttribute('Id') === id) {
    return element
  }
  for (const child of element.children) {
    const found = findElementById(child, id)
    if (found) return found
  }
  return null
}

function collectAncestorNamespaces(element: Element): Map<string, string> {
  const ns = new Map<string, string>()
  let node = element.parentElement
  while (node) {
    for (const attr of node.attributes) {
      if (attr.name === 'xmlns') {
        if (!ns.has('')) ns.set('', attr.value)
      } else if (attr.name.startsWith('xmlns:')) {
        const prefix = attr.name.substring(6)
        if (!ns.has(prefix)) ns.set(prefix, attr.value)
      }
    }
    node = node.parentElement
  }
  return ns
}

function serializeNode(node: Element, inheritedNs: Map<string, string>): string {
  const localName = node.localName
  const prefix = node.prefix
  const tagName = prefix ? `${prefix}:${localName}` : localName

  // この要素の名前空間宣言を収集
  const nsDecls = new Map<string, string>()
  const regularAttrs: Array<{ name: string; value: string; nsUri: string }> = []

  for (const attr of node.attributes) {
    if (attr.name === 'xmlns') {
      nsDecls.set('', attr.value)
    } else if (attr.name.startsWith('xmlns:')) {
      nsDecls.set(attr.name.substring(6), attr.value)
    } else {
      regularAttrs.push({
        name: attr.name,
        value: attr.value,
        nsUri: attr.namespaceURI || '',
      })
    }
  }

  // 出力する名前空間宣言を決定（C14N: visibly utilized かつ親で未宣言のもの）
  const outputNsDecls = new Map<string, string>()

  // この要素自体が使う名前空間
  if (prefix) {
    const nsUri = node.namespaceURI || ''
    if (inheritedNs.get(prefix) !== nsUri) {
      outputNsDecls.set(prefix, nsUri)
    }
  } else if (node.namespaceURI) {
    const defaultNs = inheritedNs.get('')
    if (defaultNs !== node.namespaceURI) {
      outputNsDecls.set('', node.namespaceURI)
    }
  } else {
    // 名前空間なし — デフォルト名前空間がある場合はリセット
    if (inheritedNs.has('') && inheritedNs.get('') !== '') {
      outputNsDecls.set('', '')
    }
  }

  // 属性が使う���前空間
  for (const attr of regularAttrs) {
    if (attr.nsUri && attr.nsUri !== XML_NS) {
      const attrPrefix = attr.name.split(':')[0]!
      if (attrPrefix !== attr.name && inheritedNs.get(attrPrefix) !== attr.nsUri) {
        outputNsDecls.set(attrPrefix, attr.nsUri)
      }
    }
  }

  // 明示的に宣言された名前空間で、子孫が使う可能性があるもの
  for (const [p, uri] of nsDecls) {
    if (!outputNsDecls.has(p) && inheritedNs.get(p) !== uri) {
      outputNsDecls.set(p, uri)
    }
  }

  // 名前空間宣言をソート（デフォルトns が最初、それ以外はプレフィックスの辞書順）
  const sortedNsDecls = [...outputNsDecls.entries()].sort((a, b) => {
    if (a[0] === '') return -1
    if (b[0] === '') return 1
    return a[0].localeCompare(b[0])
  })

  // 通常属性をソート（namespace URI → local name の辞書順）
  regularAttrs.sort((a, b) => {
    if (a.nsUri !== b.nsUri) return a.nsUri.localeCompare(b.nsUri)
    return a.name.localeCompare(b.name)
  })

  // 子要素用の名前空間コンテキスト更新
  const childNs = new Map(inheritedNs)
  for (const [p, uri] of outputNsDecls) {
    childNs.set(p, uri)
  }

  // シリアライズ
  let result = `<${tagName}`

  for (const [p, uri] of sortedNsDecls) {
    if (p === '') {
      result += ` xmlns="${escapeAttr(uri)}"`
    } else {
      result += ` xmlns:${p}="${escapeAttr(uri)}"`
    }
  }

  for (const attr of regularAttrs) {
    result += ` ${attr.name}="${escapeAttr(attr.value)}"`
  }

  result += '>'

  // 子ノードをシリアライズ（C14N: 空要素も開始+終了タグ）
  for (const child of node.childNodes) {
    if (child.nodeType === Node.ELEMENT_NODE) {
      result += serializeNode(child as Element, childNs)
    } else if (child.nodeType === Node.TEXT_NODE) {
      result += escapeText(child.textContent || '')
    } else if (child.nodeType === Node.CDATA_SECTION_NODE) {
      // C14N: CDATA はテキストに変換
      result += escapeText(child.textContent || '')
    } else if (child.nodeType === Node.PROCESSING_INSTRUCTION_NODE) {
      const pi = child as ProcessingInstruction
      result += `<?${pi.target} ${pi.data}?>`
    }
  }

  result += `</${tagName}>`
  return result
}

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;')
    .replace(/\t/g, '&#x9;')
    .replace(/\n/g, '&#xA;')
    .replace(/\r/g, '&#xD;')
}

function escapeText(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\r/g, '&#xD;')
}
