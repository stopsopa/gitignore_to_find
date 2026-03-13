import gitignoreToFind from "./gitignoreToFind.ts";

const data = await gitignoreToFind(
  `
.git
.env
.DS_Store
bin/
**/*.rendered.html
    `,
  {},
);

console.log(`
    
    
    ${data.join(" ")}
    
    
    `);
