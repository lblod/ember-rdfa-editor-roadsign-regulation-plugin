export default function includeInstructions(html, instructions) {
  let finalHtml = html;
  for (let instruction of instructions) {
    console.log(`\${${instruction.name}}`);
    finalHtml = finalHtml.replaceAll(
      `\${${instruction.name}}`,
      instruction.annotated
    );
  }
  return finalHtml;
}
