import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveCapturePermission } from "../src/lib/capture-permissions";

const granted = { status: "granted", granted: true, canAskAgain: true };
const denied = { status: "denied", granted: false, canAskAgain: true };
const blocked = { ...denied, canAskAgain: false };

test("already-granted permission completes without entering the hanging request path", async () => {
  let requests = 0;
  const result = await resolveCapturePermission(
    async () => granted,
    () => { requests++; return new Promise(() => {}); },
  );
  assert.equal(result, granted);
  assert.equal(requests, 0);
});

test("first use requests permission and honors the response", async () => {
  let requests = 0;
  const result = await resolveCapturePermission(
    async () => ({ ...denied, status: "undetermined" }),
    async () => { requests++; return granted; },
  );
  assert.equal(result, granted);
  assert.equal(requests, 1);
});

test("permanently denied permission returns without requesting again", async () => {
  const result = await resolveCapturePermission(
    async () => blocked,
    async () => { throw new Error("must open Settings instead"); },
  );
  assert.equal(result, blocked);
});

test("rechecks OS state on later uses instead of caching a previous grant", async () => {
  let current = granted;
  let checks = 0;
  const getPermission = async () => { checks++; return current; };
  const requestPermission = async () => { throw new Error("no prompt needed"); };
  assert.equal(await resolveCapturePermission(getPermission, requestPermission), granted);
  current = blocked;
  assert.equal(await resolveCapturePermission(getPermission, requestPermission), blocked);
  assert.equal(checks, 2);
});

test("denial stays denied and a native failure propagates", async () => {
  assert.equal(await resolveCapturePermission(async () => denied, async () => blocked), blocked);
  await assert.rejects(
    resolveCapturePermission(async () => denied, async () => { throw new Error("native failure"); }),
    /native failure/,
  );
});
