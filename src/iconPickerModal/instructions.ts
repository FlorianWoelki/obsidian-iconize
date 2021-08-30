export interface Instruction {
  key: string;
  description: string;
}

export const createInstructions = (container: HTMLElement, instructions: Instruction[]): HTMLElement => {
  const footerNode = container.createDiv();
  footerNode.classList.add('prompt-instructions');

  instructions.forEach((instruction) => {
    const instructionNode = footerNode.createDiv();
    instructionNode.classList.add('prompt-instruction');
    const instructionKeyNode = instructionNode.createSpan();
    instructionKeyNode.classList.add('prompt-instruction-command');
    instructionKeyNode.textContent = instruction.key;
    const instructionDescriptionNode = instructionNode.createSpan();
    instructionDescriptionNode.textContent = instruction.description;

    instructionNode.appendChild(instructionKeyNode);
    instructionNode.appendChild(instructionDescriptionNode);

    footerNode.appendChild(instructionNode);
  });

  return footerNode;
};
