export default function includeInstructions(html, instructions, annotated) {
  let finalHtml = html;
  for (let instruction of instructions) {
    console.log(`\${${instruction.name}}`);
    finalHtml = finalHtml.replaceAll(
      `\${${instruction.name}}`,
      annotated ? instruction.annotated : instruction.value
    );
  }
  return finalHtml;
}
