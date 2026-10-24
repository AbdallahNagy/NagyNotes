import { describe, expect, it } from 'vitest';
import {
  ancestorIds,
  idToSegments,
  idToUrl,
  lastSegment,
  parentId,
  prettifyFolderName,
  segmentsToId,
} from '@/lib/content/paths';

describe('paths', () => {
  it('maps ids to URLs without a trailing slash', () => {
    expect(idToUrl('apis/authentication')).toBe('/apis/authentication');
  });

  it('round-trips ids and segments', () => {
    const id = 'apis/authentication/oauth-2-0/client-credentials';
    expect(segmentsToId(idToSegments(id))).toBe(id);
    expect(idToSegments(id)).toHaveLength(4);
  });

  it('finds the parent and last segment', () => {
    expect(parentId('apis/authentication')).toBe('apis');
    expect(parentId('apis')).toBeNull();
    expect(lastSegment('apis/authentication')).toBe('authentication');
    expect(lastSegment('apis')).toBe('apis');
  });

  it('lists ancestors outermost first, excluding the id itself', () => {
    expect(ancestorIds('a/b/c')).toEqual(['a', 'a/b']);
    expect(ancestorIds('a')).toEqual([]);
  });
});

describe('prettifyFolderName', () => {
  it('title-cases words split on dashes and underscores', () => {
    expect(prettifyFolderName('business-applications')).toBe('Business Applications');
    expect(prettifyFolderName('power_platform')).toBe('Power Platform');
    expect(prettifyFolderName('oauth-2-0')).toBe('Oauth 2 0');
  });

  it('ignores repeated and edge separators', () => {
    expect(prettifyFolderName('--rate--limiting-')).toBe('Rate Limiting');
  });
});
