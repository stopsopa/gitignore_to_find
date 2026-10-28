

export default function extract(line: string) {
  return line.replace(/^(delete|create|update)\s+/, '');
}