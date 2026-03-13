
import { test } from "node:test";
import assert from "node:assert";
import isUnignoreInGivenDir from './isUnignoreInGivenDir.ts';

/**
 * /bin/bash ts.sh --test src/gitignore_to_find/isUnignoreInGivenDir.test.ts
 */
test('isUnignoreInGivenDir', async (t) => {
  await t.test('unanchored directory rule should match any part of the unignore path', () => {
    assert.strictEqual(isUnignoreInGivenDir('dir/', '!/test/dir/else/my.txt'), true);
    assert.strictEqual(isUnignoreInGivenDir('dir/', '!/dir/nested/file.txt'), true);
    assert.strictEqual(isUnignoreInGivenDir('dir/', '!/other/path/file.txt'), false);
  });

  await t.test('anchored directory rule should only match from root', () => {
    assert.strictEqual(isUnignoreInGivenDir('/dir/', '!/dir/nested/file.txt'), true);
    assert.strictEqual(isUnignoreInGivenDir('/dir/', '!/test/dir/else/my.txt'), false);
  });

  await t.test('rule with slash in the middle should NOT be anchored by default (consistent with gitignoreToFind.ts)', () => {
    assert.strictEqual(isUnignoreInGivenDir('a/b/', '!/a/b/c.txt'), true);
    assert.strictEqual(isUnignoreInGivenDir('a/b/', '!/x/a/b/c.txt'), true);
  });

  await t.test('wildcards in rules', () => {
    assert.strictEqual(isUnignoreInGivenDir('d*/', '!/dir/file.txt'), true);
    assert.strictEqual(isUnignoreInGivenDir('d*/', '!/data/file.txt'), true);
    assert.strictEqual(isUnignoreInGivenDir('d*/', '!/other/dir/file.txt'), true);
    
    assert.strictEqual(isUnignoreInGivenDir('/d*/', '!/dir/file.txt'), true);
    assert.strictEqual(isUnignoreInGivenDir('/d*/', '!/other/dir/file.txt'), false);

    assert.strictEqual(isUnignoreInGivenDir('d?r/', '!/dir/file.txt'), true);
    assert.strictEqual(isUnignoreInGivenDir('d?r/', '!/dar/file.txt'), true);
    assert.strictEqual(isUnignoreInGivenDir('d?r/', '!/dr/file.txt'), false);
  });

  await t.test('double star at start of rule', () => {
    assert.strictEqual(isUnignoreInGivenDir('**/nested/', '!/a/b/nested/file.txt'), true);
    assert.strictEqual(isUnignoreInGivenDir('**/nested/', '!/nested/file.txt'), true);
    assert.strictEqual(isUnignoreInGivenDir('**/nested/', '!/other/file.txt'), false);
  });

  await t.test('double star in middle of rule (user request)', () => {
    // dirRule: **/test/**/mystuff/**/test.txt
    // unignoreRule: !**/abc/test/**/mystuff/**/test.txt
    
    // Note: If unignoreRule has **, we return true conservatively for now.
    assert.strictEqual(isUnignoreInGivenDir('**/test/**/mystuff/**/test.txt', '!**/abc/test/**/mystuff/**/test.txt'), true);
    
    // Let's test without ** in unignore to see if complex pattern matches
    assert.strictEqual(isUnignoreInGivenDir('test/**/mystuff', '!/abc/test/xyz/mystuff/file.txt'), true);
    assert.strictEqual(isUnignoreInGivenDir('test/**/mystuff', '!/abc/test/mystuff/file.txt'), true);
    assert.strictEqual(isUnignoreInGivenDir('test/**/mystuff', '!/test/mystuff/file.txt'), true);
    assert.strictEqual(isUnignoreInGivenDir('test/**/mystuff', '!/other/test/file.txt'), false);
  });

  await t.test('unignore with wildcards (conservative)', () => {
    // If unignore is a broad pattern, it might contain anything.
    assert.strictEqual(isUnignoreInGivenDir('dir/', '!**/my.txt'), true);
  });

  await t.test('real world example from user', () => {
    assert.strictEqual(isUnignoreInGivenDir('dir/', '!/test/dir/else/my.txt'), true);
  });

  await t.test('more user requests', () => {
    assert.strictEqual(isUnignoreInGivenDir('*/dir/*', '!ttt/dir/kloc.ttt'), true);
    assert.strictEqual(isUnignoreInGivenDir('*/dir/', '!ttt/dir/kloc.ttt'), true);
  });

  await t.test('edge cases for coverage', () => {
    // unignoreRule without !
    assert.strictEqual(isUnignoreInGivenDir('dir/', '/test/dir/else/my.txt'), true);
    // anchored rule longer than unignore path
    assert.strictEqual(isUnignoreInGivenDir('/a/b/', '!/a'), false);
    // matches directly but not prefix
    assert.strictEqual(isUnignoreInGivenDir('file.txt', '!file.txt'), true);
  });
});
