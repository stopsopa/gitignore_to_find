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

module.exports = (setup) => {
  return {
    help: {
      command: `
set -e  
# git config core.excludesFile .git/.gitignore_local

source .env
# source .env.sh
        
cat <<EEE

  🐙 GitHub: $(git ls-remote --get-url origin | awk '{$1=$1};1' | tr -d '\\n' | sed -E 's/git@github\\.com:([^/]+)\\/(.+)\\.git/https:\\/\\/github.com\\/\\1\\/\\2/g')

  http://0.0.0.0:\${PORT}/form-ui/index.html


EEE

      `,
      description: "Status of all things",
      source: false,
      confirm: false,
    },
    [`server`]: {
      command: `
set -e
cat <<EEE

/bin/bash ts.sh src/server.ts
/bin/bash ts.sh --watch src/server.ts

EEE
`,
      description: `docker down & up - basically can be used for restarting too`,
      confirm: false,
    },
    [`coverage`]: {
      command: `   
FILE="coverage/index.html"
if [ ! -f "\${FILE}" ]; then

  cat <<EEE

  file >\${FILE}< doesn't exist

EEE
  
  exit 1
fi  

FILE="file://\$(realpath "\${FILE}")"   

cat <<EEE

Ways to open:
    open "\${FILE}"
    open -a "Google Chrome" "\${FILE}"

EEE

echo -e "\\n      Press enter to continue\\n"
read

open "\${FILE}"
      `,
      confirm: false,
    },

    ...setup,
  };
};
