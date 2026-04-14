import { describe, it, expect } from 'vitest';
import { EgovApiError } from '../src/errors';

describe('EgovApiError', () => {
  it('is an instance of Error', () => {
    const err = new EgovApiError({
      statusCode: 400,
      resultCode: 'BAD_REQUEST',
      errorMessages: ['Invalid parameter'],
    });
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(EgovApiError);
  });

  it('sets all properties correctly', () => {
    const reportList = [{ form_name: 'form1', content: 'error1' }];
    const err = new EgovApiError({
      statusCode: 422,
      resultCode: 'VALIDATION_ERROR',
      errorMessages: ['Field is required', 'Field is invalid'],
      reportList,
    });
    expect(err.name).toBe('EgovApiError');
    expect(err.statusCode).toBe(422);
    expect(err.resultCode).toBe('VALIDATION_ERROR');
    expect(err.errorMessages).toEqual(['Field is required', 'Field is invalid']);
    expect(err.reportList).toEqual(reportList);
    expect(err.message).toBe('Field is required; Field is invalid');
  });

  it('generates fallback message when errorMessages is empty', () => {
    const err = new EgovApiError({
      statusCode: 500,
      resultCode: 'INTERNAL_ERROR',
      errorMessages: [],
    });
    expect(err.message).toBe('e-Gov API error 500: INTERNAL_ERROR');
  });

  it('reportList is undefined when not provided', () => {
    const err = new EgovApiError({
      statusCode: 401,
      resultCode: 'UNAUTHORIZED',
      errorMessages: ['Unauthorized'],
    });
    expect(err.reportList).toBeUndefined();
  });
});
