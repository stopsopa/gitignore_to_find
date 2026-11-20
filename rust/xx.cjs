// to install go to: https://stopsopa.github.io//pages/bash/index.html#xx

// https://stopsopa.github.io/viewer.html?file=%2Fpages%2Fbash%2Fxx%2Fxx-template.cjs
// edit: https://github.com/stopsopa/stopsopa.github.io/blob/master/pages/bash/xx/xx-template.cjs

// 🚀 -
// ✅ -
// ⚙️  -
// 🗑️  -
// 🛑 -
// to call other xx commands from inside any xx command use:
//    shopt -s expand_aliases && source ~/.bashrc
// after that just do:
//   xx <command_name>

/**
 * Commands for the rust implementation of gitignore_to_find.
 * Meant to be used from inside of the 'rust' directory (cd rust && xx).
 * All scripts called here work relative to their own location,
 * so paths below are relative to the 'rust' directory.
 * More details in DEV.md
 */
module.exports = (setup) => {
  return {
    help: {
      command: `
set -e

source ../bash/detect_arch.sh

cat <<EEE

  🐙 GitHub: $(git ls-remote --get-url origin | awk '{$1=$1};1' | tr -d '\\n' | sed -E 's/git@github\\.com:([^/]+)\\/(.+)\\.git/https:\\/\\/github.com\\/\\1\\/\\2/g')

  target:  \${TARGET}
  binary:  \${GITIGNORE_TO_FIND_BIN}

  docs:    DEV.md, PLAN.md

EEE

      `,
      description: "Status of all things",
      source: false,
      confirm: false,
    },
    [`validateenv`]: {
      command: `
set -e
/bin/bash validateenv.sh
`,
      description: `check rust toolchain and fetch dependencies`,
      confirm: false,
    },
    [`compile`]: {
      command: `
set -e
/bin/bash compile.sh
`,
      description: `build release binary to bin/<arm64|x64>/gitignore_to_find`,
      confirm: false,
    },
    [`test`]: {
      command: `
set -e
/bin/bash test.sh
`,
      description: `all tests against compiled binary (shared ../tests suite + parity)`,
      confirm: false,
    },
    [`parity`]: {
      command: `
set -e
/bin/bash test/parity.sh
`,
      description: `only comparison of the binary with 'git check-ignore'`,
      confirm: false,
    },
    [`compile and test`]: {
      command: `
set -e
/bin/bash compile.sh
/bin/bash test.sh
`,
      description: `build and then run all tests`,
      confirm: false,
    },
    [`version`]: {
      command: `
set -e
source ../bash/detect_arch.sh
"\${GITIGNORE_TO_FIND_BIN}" --version
`,
      description: `print version of compiled binary ("dev" for local builds)`,
      confirm: false,
    },
    [`binary help`]: {
      command: `
set -e
source ../bash/detect_arch.sh
"\${GITIGNORE_TO_FIND_BIN}" --help
`,
      description: `print --help of compiled binary`,
      confirm: false,
    },
    [`tag patch`]: {
      command: `
set -e
/bin/bash tag.sh patch
`,
      description: `release: create and push next patch tag (x.y.Z+1) - triggers GitHub Release`,
      confirm: true,
    },
    [`tag minor`]: {
      command: `
set -e
/bin/bash tag.sh minor
`,
      description: `release: create and push next minor tag (x.Y+1.0) - triggers GitHub Release`,
      confirm: true,
    },
    [`tag major`]: {
      command: `
set -e
/bin/bash tag.sh major
`,
      description: `release: create and push next major tag (X+1.0.0) - triggers GitHub Release`,
      confirm: true,
    },

    ...setup,
  };
};
