function nowIso() {
  return new Date().toISOString();
}

function parseSince(value) {
  if (!value) {
    return new Date(0);
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return new Date(0);
  }
  return parsed;
}

module.exports = {
  nowIso,
  parseSince,
};
