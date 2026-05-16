export type NodeIdExists = (nodeId: string) => boolean | Promise<boolean>;

export function generateNodeId(random: () => number = Math.random): string {
  const num = Math.floor(random() * 99999)
    .toString()
    .padStart(5, "0");
  return `BLK-${num}-LDN`;
}

export async function generateUniqueNodeId(
  exists: NodeIdExists,
  options: {
    maxAttempts?: number;
    generate?: () => string;
  } = {}
): Promise<string> {
  const maxAttempts = options.maxAttempts ?? 10;
  const generate = options.generate ?? generateNodeId;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const candidate = generate();
    if (!(await exists(candidate))) return candidate;
  }

  throw new Error("Unable to allocate unique node_id");
}
