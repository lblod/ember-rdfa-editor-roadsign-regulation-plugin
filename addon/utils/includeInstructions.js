export default function includeInstructions(html, instructions, annotated) {
  let finalHtml = html;
  for (let instruction of instructions) {
    finalHtml = finalHtml.replaceAll(
      `\${${instruction.name}}`,
      annotated ? instruction.annotated : instruction.value
    );
  }
  return finalHtml;
}
