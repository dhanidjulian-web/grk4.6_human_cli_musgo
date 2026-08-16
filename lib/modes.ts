import { ComponentProps } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { AgentMode } from './types';
import { colors } from './theme';

type IonName = ComponentProps<typeof Ionicons>['name'];

export interface ModeMeta {
  id: AgentMode;
  label: string;
  short: string;
  icon: IonName;
  color: string;
  description: string;
  hint: string;
}

export const MODE_LIST: ModeMeta[] = [
  {
    id: 'auto',
    label: 'Auto Router',
    short: 'AUTO',
    icon: 'git-network-outline',
    color: colors.violet,
    description: 'Analisa konteks lalu pilih mode terbaik secara otomatis.',
    hint: 'Deteksi intent → rute ke CLI, Browser, Code, SSH, Security, …',
  },
  {
    id: 'cli',
    label: 'CLI Terminal',
    short: 'CLI',
    icon: 'terminal-outline',
    color: colors.green,
    description: 'Shell lokal, paket, git, docker, dan pipeline perintah.',
    hint: 'npm · git · docker · ls · build',
  },
  {
    id: 'ssh',
    label: 'SSH Remote',
    short: 'SSH',
    icon: 'server-outline',
    color: colors.cyan,
    description: 'Sesi remote ke VPS / cloud host melalui saluran terenkripsi.',
    hint: 'ssh user@host · tmux · systemd',
  },
  {
    id: 'sftp',
    label: 'SFTP Transfer',
    short: 'SFTP',
    icon: 'swap-horizontal-outline',
    color: colors.mint,
    description: 'Transfer file dua arah ke remote filesystem.',
    hint: 'put · get · ls remote · chmod',
  },
  {
    id: 'browser',
    label: 'Browser',
    short: 'WEB',
    icon: 'globe-outline',
    color: colors.cyan,
    description: 'Buka dokumentasi, riset URL, dan rangkum halaman.',
    hint: 'docs · url · search · fetch',
  },
  {
    id: 'chat',
    label: 'Chat Assistant',
    short: 'CHAT',
    icon: 'chatbubbles-outline',
    color: colors.violet,
    description: 'Obrolan, penjelasan, perencanaan, dan reasoning.',
    hint: 'jelaskan · rencanakan · bandingkan',
  },
  {
    id: 'code',
    label: 'Agent Code',
    short: 'CODE',
    icon: 'code-slash-outline',
    color: colors.amber,
    description: 'Generate, refactor, dan review kode serta workflow.',
    hint: 'github action · script · README',
  },
  {
    id: 'security',
    label: 'Security Audit',
    short: 'SEC',
    icon: 'shield-checkmark-outline',
    color: colors.coral,
    description: 'Review, audit, dan scan defensif — tanpa payload serangan.',
    hint: 'OWASP · secrets · deps · headers',
  },
  {
    id: 'pentest',
    label: 'Pentest Review',
    short: 'PT',
    icon: 'scan-outline',
    color: colors.coral,
    description: 'Review permukaan defensif. Tidak membuat exploit, payload, atau serangan.',
    hint: 'surface · headers · secrets · OWASP',
  },
  {
    id: 'multimodal',
    label: 'Multimodal',
    short: 'GEN',
    icon: 'color-palette-outline',
    color: colors.violet,
    description: 'Text-to-image lewat Pollinations (live, tanpa key).',
    hint: 'gambar · poster · ikon · banner',
  },
  {
    id: 'deploy',
    label: 'Deploy / Cloud',
    short: 'SHIP',
    icon: 'cloud-upload-outline',
    color: colors.cyan,
    description: 'Rencana deploy, VPS, CI/CD, dan checklist rilis.',
    hint: 'vercel · docker · nginx · systemd',
  },
  {
    id: 'agent',
    label: 'Autonomous Agent',
    short: 'AGENT',
    icon: 'hardware-chip-outline',
    color: colors.green,
    description: 'Planning → eksekusi multi-langkah dengan memory & tools.',
    hint: 'plan · tool-use · verify · report',
  },
];

export const MODE_MAP: Record<AgentMode, ModeMeta> = MODE_LIST.reduce(
  (acc, m) => {
    acc[m.id] = m;
    return acc;
  },
  {} as Record<AgentMode, ModeMeta>
);

export function getMode(id: AgentMode): ModeMeta {
  return MODE_MAP[id] ?? MODE_MAP.agent;
}
