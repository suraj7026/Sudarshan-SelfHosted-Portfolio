import assert from 'node:assert/strict';
const origin = process.argv[2];
assert.ok(origin, 'Supply an isolated gateway origin');
async function get(path) {
  const response = await fetch(`${origin}${path}`, { signal: AbortSignal.timeout(10000) });
  assert.equal(response.status, 200, path);
  return response;
}
const html = await (await get('/')).text();
assert.ok(html.includes('id="root"'));
const asset = html.match(/src="([^" ]*\/static\/js\/[^" ]+\.js)"/);
assert.ok(asset);
assert.ok((await (await get(asset[1])).text()).length > 100);
const profile = await (await get('/api/v1/profile')).json();
assert.equal(profile.name, 'CI Fixture');
assert.equal(profile.social_links.github, 'https://example.invalid');
for (const path of ['experience', 'skills', 'certifications']) {
  const records = await (await get(`/api/v1/${path}`)).json();
  assert.equal(records.length, 1, path);
}
const projects = await (await get('/api/v1/projects')).json();
assert.equal(projects.length, 2);
const featured = await (await get('/api/v1/projects?featured=true')).json();
assert.equal(featured.length, 1);
assert.equal(featured[0].title, 'Featured fixture');
const image = await get('/images/fixture.svg');
assert.ok(image.headers.get('content-type')?.includes('image/svg+xml'));
assert.ok((await image.text()).includes('CI fixture'));
console.log('PASS frontend bundle, five DB-backed APIs, featured filtering, and gateway image routing');
console.log('Disposable PostgreSQL and mock MinIO only; no production data or credentials used.');
