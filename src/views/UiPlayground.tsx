import { useState } from 'react';
import { Plus, Search, Save, Trash2, ArrowRight, Wallet, Heart, Coffee } from 'lucide-react';
import {
  Button,
  IconButton,
  Card,
  CardHeader,
  CardTitle,
  CardBody,
  Badge,
  ProgressBar,
  MoneyText,
  JarChip,
  JarIconCircle,
  Skeleton,
  EmptyState,
} from '../components/ui';
import { JAR_ORDER } from '../lib/jars';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-b border-[var(--color-border-light)] pb-8 mb-8 last:border-b-0">
      <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-4">
        {title}
      </h2>
      <div className="flex flex-wrap gap-3 items-start">{children}</div>
    </section>
  );
}

export default function UiPlayground() {
  const [selectedJar, setSelectedJar] = useState<string>('NEC');

  return (
    <div className="max-w-6xl mx-auto p-6 bg-[var(--color-surface-alt)] min-h-screen text-[var(--color-text-primary)]">
      <header className="mb-8">
        <h1 className="text-2xl font-bold mb-1">UI Playground · Phase A primitives</h1>
        <p className="text-sm text-[var(--color-text-muted)]">
          Toggle dark mode bằng button góc phải TopBar. Thay đổi tokens ở <code className="bg-[var(--color-surface-sunken)] px-1 rounded">src/index.css</code>.
        </p>
      </header>

      <Section title="Buttons · variants × sizes">
        <Button variant="primary" size="sm">Primary sm</Button>
        <Button variant="primary" size="md">Primary md</Button>
        <Button variant="primary" size="lg">Primary lg</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="danger">Danger</Button>
        <Button variant="link">Link</Button>
        <Button variant="primary" icon={Plus}>With icon</Button>
        <Button variant="primary" icon={ArrowRight} iconPosition="right">Right icon</Button>
        <Button variant="primary" loading>Loading</Button>
        <Button variant="primary" disabled>Disabled</Button>
      </Section>

      <Section title="IconButton · variants × sizes">
        <IconButton aria-label="Search" icon={Search} size="sm" />
        <IconButton aria-label="Search" icon={Search} size="md" />
        <IconButton aria-label="Search" icon={Search} size="lg" />
        <IconButton aria-label="Save" icon={Save} variant="solid" />
        <IconButton aria-label="Delete" icon={Trash2} variant="solid" />
      </Section>

      <Section title="Cards · variants">
        <Card variant="default" className="w-60">
          <CardHeader>
            <CardTitle>Default card</CardTitle>
          </CardHeader>
          <CardBody>
            <p className="text-sm text-[var(--color-text-secondary)]">Body text content here.</p>
          </CardBody>
        </Card>
        <Card variant="raised" className="w-60">
          <CardHeader>
            <CardTitle>Raised card</CardTitle>
          </CardHeader>
          <CardBody>
            <p className="text-sm text-[var(--color-text-secondary)]">More elevated shadow.</p>
          </CardBody>
        </Card>
        <Card variant="interactive" className="w-60" onClick={() => alert('clicked')}>
          <CardHeader>
            <CardTitle>Interactive</CardTitle>
          </CardHeader>
          <CardBody>
            <p className="text-sm text-[var(--color-text-secondary)]">Hover + click effects.</p>
          </CardBody>
        </Card>
      </Section>

      <Section title="Badge · flow / status / jar">
        <Badge variant="income">Thu nhập</Badge>
        <Badge variant="expense">Chi tiêu</Badge>
        <Badge variant="transfer">Chuyển khoản</Badge>
        <Badge variant="ok">Đúng tiến độ</Badge>
        <Badge variant="warn">Sắp vượt</Badge>
        <Badge variant="over">Vượt mức</Badge>
        <Badge variant="primary">Primary</Badge>
        <Badge variant="neutral">Neutral</Badge>
        <Badge variant="jar-NEC">NEC</Badge>
        <Badge variant="jar-EDU">EDU</Badge>
        <Badge variant="jar-PLAY">PLAY</Badge>
        <Badge variant="jar-FFA">FFA</Badge>
      </Section>

      <Section title="ProgressBar · auto tone">
        <div className="w-60"><ProgressBar value={30} ariaLabel="30 percent" /></div>
        <div className="w-60"><ProgressBar value={75} /></div>
        <div className="w-60"><ProgressBar value={85} /></div>
        <div className="w-60"><ProgressBar value={120} /></div>
        <div className="w-60"><ProgressBar value={45} size="md" tone="primary" /></div>
        <div className="w-60"><ProgressBar value={60} size="lg" tone="ok" /></div>
      </Section>

      <Section title="MoneyText · sizes × flows">
        <MoneyText value={4236000} size="display" />
        <MoneyText value={18000000} size="h1" flow="income" />
        <MoneyText value={1800000} size="h2" flow="expense" />
        <MoneyText value={500000} size="h3" flow="transfer" />
        <MoneyText value={50000} flow="expense" />
        <MoneyText value={45000} flow="income" />
        <MoneyText value={230000} flow="expense" size="caption" />
      </Section>

      <Section title="JarChip · 6 jars × interactive">
        {JAR_ORDER.map((k) => (
          <JarChip
            key={k}
            jarKey={k}
            size="md"
            selected={selectedJar === k}
            onClick={() => setSelectedJar(k)}
          />
        ))}
        <div className="w-full h-px" />
        {JAR_ORDER.map((k) => (
          <JarChip key={`lg-${k}`} jarKey={k} size="lg" />
        ))}
      </Section>

      <Section title="JarIconCircle · 6 sizes">
        {JAR_ORDER.map((k) => (
          <JarIconCircle key={k} jarKey={k} size={36} />
        ))}
        <JarIconCircle jarKey="NEC" size={48} />
        <JarIconCircle jarKey="UNKNOWN_KEY" size={36} />
      </Section>

      <Section title="Skeleton · variants">
        <div className="w-60 flex flex-col gap-2">
          <Skeleton variant="text" count={3} />
        </div>
        <Skeleton variant="card" className="w-60" />
        <Skeleton variant="circle" width={48} height={48} />
        <Skeleton variant="chart" className="w-80" />
      </Section>

      <Section title="EmptyState">
        <Card variant="default" padding="none" className="w-80 max-w-full">
          <EmptyState
            icon={Wallet}
            title="Chưa có giao dịch"
            description="Tháng này bạn chưa thêm giao dịch nào. Tap vào nút bên dưới để bắt đầu."
            action={{ label: 'Thêm giao dịch', onClick: () => alert('add'), icon: Plus }}
          />
        </Card>
        <Card variant="default" padding="none" className="w-80 max-w-full">
          <EmptyState
            size="sm"
            icon={Coffee}
            title="Không tìm thấy"
            description="Thử filter khác."
          />
        </Card>
      </Section>

      <Section title="Composition · transaction row demo">
        <Card variant="interactive" className="w-full max-w-2xl">
          <div className="flex items-center gap-3">
            <JarIconCircle jarKey="NEC" size={36} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--color-text-primary)]">Cà phê sáng</p>
              <p className="text-xs text-[var(--color-text-muted)]">09:30 · Hũ NEC · Thiết yếu</p>
            </div>
            <MoneyText value={50000} flow="expense" />
          </div>
        </Card>
      </Section>

      <Section title="Composition · jar mini card">
        <Card variant="interactive" className="w-72">
          <div className="flex items-center gap-2 mb-3">
            <JarIconCircle jarKey="NEC" size={32} />
            <div className="flex-1 min-w-0">
              <div className="text-xs text-[var(--color-text-muted)] font-medium">NEC</div>
              <div className="text-sm font-semibold">Thiết yếu</div>
            </div>
            <Badge variant="warn" icon={<Heart className="size-3" />}>78%</Badge>
          </div>
          <div className="flex items-baseline justify-between mb-1.5">
            <MoneyText value={1800000} size="body" />
            <span className="text-xs text-[var(--color-text-faint)]">/ <MoneyText value={9900000} size="caption" /></span>
          </div>
          <ProgressBar value={78} />
          <div className="text-xs text-[var(--color-text-muted)] mt-2">
            <span className="inline-block size-1.5 rounded-full bg-[var(--color-warn)] mr-1" />
            sắp hết · còn 8,1M
          </div>
        </Card>
      </Section>
    </div>
  );
}
