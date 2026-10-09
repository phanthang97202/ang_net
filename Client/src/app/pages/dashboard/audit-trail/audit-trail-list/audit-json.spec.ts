import { formatAuditJson } from './audit-json';

describe('Audit JSON display', () => {
  it('expands serialized object and array fields and decodes Vietnamese escapes', () => {
    const raw = JSON.stringify([
      {
        Key: 'request',
        Value:
          '{"Note":"Ti\\u1ec1n ph\\u00f2ng","Transactions":"[{\\"Room\\":\\"803\\"}]"}',
      },
    ]);
    const formatted = formatAuditJson(raw);
    expect(JSON.parse(formatted)[0].Value).toEqual({
      Note: 'Tiền phòng',
      Transactions: [{ Room: '803' }],
    });
    expect(formatted).toContain('\n');
    expect(formatted).not.toContain('\\u');
    expect(formatted).not.toContain('\\"');
  });
  it('decodes multiply serialized roots but preserves ordinary strings and HTML as text', () => {
    const raw = JSON.stringify(
      JSON.stringify({
        Amount: '0012',
        Note: 'not {json}',
        Unsafe: '<img src=x onerror=alert(1)>',
        Active: true,
      })
    );
    expect(JSON.parse(formatAuditJson(raw))).toEqual({
      Amount: '0012',
      Note: 'not {json}',
      Unsafe: '<img src=x onerror=alert(1)>',
      Active: true,
    });
  });
  it('reports invalid outer JSON rather than rewriting its data', () => {
    expect(() => formatAuditJson('invalid {')).toThrow();
    expect(() => formatAuditJson('')).toThrow();
  });
});
