/**
 * Some CI and evaluation harnesses export `GIT_CONFIG_COUNT` and a value for entry 0 but
 * omit the matching `GIT_CONFIG_KEY_0`. Every `git` call then fails before it can read a
 * test repository, including the child processes the release and bench tests spawn.
 *
 * Remove an incomplete set once for the whole worker. A complete set is left alone, so a
 * harness that really configures git still gets its configuration.
 */
const count = Number(process.env.GIT_CONFIG_COUNT ?? '0');
if (Number.isInteger(count) && count > 0) {
  let complete = true;
  for (let index = 0; index < count; index += 1) {
    if (process.env[`GIT_CONFIG_KEY_${String(index)}`] === undefined) {
      complete = false;
      break;
    }
  }
  if (!complete) {
    for (const key of Object.keys(process.env)) {
      if (/^GIT_CONFIG_(?:COUNT|KEY_\d+|VALUE_\d+)$/u.test(key)) delete process.env[key];
    }
  }
}
