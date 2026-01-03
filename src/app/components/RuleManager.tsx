import { Plus, Trash2, Edit, Shield, AlertTriangle } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { ScrollArea } from './ui/scroll-area';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';

export interface LogRule {
  id: string;
  name: string;
  description: string;
  pattern: string;
  isRegex: boolean;
  category: 'security' | 'system-failure' | 'network' | 'custom';
  severity: 'critical' | 'warning' | 'info';
  enabled: boolean;
  preset?: boolean;
}

interface RuleManagerProps {
  rules: LogRule[];
  onRulesChange: (rules: LogRule[]) => void;
}

const PRESET_RULES: Omit<LogRule, 'id' | 'enabled'>[] = [
  {
    name: 'WAN Inbound Traffic Allowed',
    description: 'OPNsense firewall log showing inbound traffic from WAN interface that was allowed',
    pattern: 'ALLOW.*,in,.*,wan,',
    isRegex: true,
    category: 'security',
    severity: 'critical',
    preset: true,
  },
  {
    name: 'Multiple Failed Login Attempts',
    description: 'Detects failed password attempts which may indicate brute force attack',
    pattern: 'Failed password|authentication failure|Invalid user',
    isRegex: true,
    category: 'security',
    severity: 'critical',
    preset: true,
  },
  {
    name: 'SSH from Public IP',
    description: 'SSH connection to local network from a public IP address',
    pattern: 'sshd.*from\\s+(?!10\\.|172\\.(1[6-9]|2[0-9]|3[01])\\.|192\\.168\\.|127\\.)',
    isRegex: true,
    category: 'security',
    severity: 'warning',
    preset: true,
  },
  {
    name: 'Kernel Panic',
    description: 'Detects Linux kernel panic events indicating critical system failure',
    pattern: 'kernel.*panic|Kernel panic',
    isRegex: true,
    category: 'system-failure',
    severity: 'critical',
    preset: true,
  },
  {
    name: 'Service Failed to Start',
    description: 'Systemd or init service failed to start',
    pattern: 'Failed to start|systemd.*failed|service.*failed',
    isRegex: true,
    category: 'system-failure',
    severity: 'warning',
    preset: true,
  },
  {
    name: 'Disk Space Critical',
    description: 'Low disk space warnings',
    pattern: 'No space left on device|disk.*full|filesystem.*full',
    isRegex: true,
    category: 'system-failure',
    severity: 'critical',
    preset: true,
  },
  {
    name: 'Unifi AP Disconnected',
    description: 'Unifi Access Point disconnection events',
    pattern: 'hostapd.*disconnected|U[A-Z0-9]+.*disconnected',
    isRegex: true,
    category: 'network',
    severity: 'warning',
    preset: true,
  },
];

export function RuleManager({ rules, onRulesChange }: RuleManagerProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<LogRule | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    pattern: '',
    isRegex: true,
    category: 'security' as LogRule['category'],
    severity: 'warning' as LogRule['severity'],
  });

  const handleLoadPresets = () => {
    const presetsWithIds = PRESET_RULES.map(preset => ({
      ...preset,
      id: `preset-${Date.now()}-${Math.random()}`,
      enabled: true,
    }));
    onRulesChange([...rules, ...presetsWithIds]);
  };

  const handleAddRule = () => {
    const newRule: LogRule = {
      id: `rule-${Date.now()}`,
      ...formData,
      enabled: true,
    };
    onRulesChange([...rules, newRule]);
    setIsDialogOpen(false);
    resetForm();
  };

  const handleEditRule = (rule: LogRule) => {
    setEditingRule(rule);
    setFormData({
      name: rule.name,
      description: rule.description,
      pattern: rule.pattern,
      isRegex: rule.isRegex,
      category: rule.category,
      severity: rule.severity,
    });
    setIsDialogOpen(true);
  };

  const handleUpdateRule = () => {
    if (!editingRule) return;
    
    const updatedRules = rules.map(rule =>
      rule.id === editingRule.id
        ? { ...rule, ...formData }
        : rule
    );
    onRulesChange(updatedRules);
    setIsDialogOpen(false);
    setEditingRule(null);
    resetForm();
  };

  const handleDeleteRule = (ruleId: string) => {
    onRulesChange(rules.filter(rule => rule.id !== ruleId));
  };

  const handleToggleRule = (ruleId: string) => {
    onRulesChange(
      rules.map(rule =>
        rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule
      )
    );
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      pattern: '',
      isRegex: true,
      category: 'security',
      severity: 'warning',
    });
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'security':
        return <Shield className="w-4 h-4" />;
      case 'system-failure':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2>Custom Alert Rules</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Define patterns to identify important logs
            </p>
          </div>
          <div className="flex gap-2">
            {rules.length === 0 && (
              <Button variant="outline" onClick={handleLoadPresets}>
                Load Presets
              </Button>
            )}
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) {
                setEditingRule(null);
                resetForm();
              }
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Rule
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingRule ? 'Edit Rule' : 'Add New Rule'}
                  </DialogTitle>
                  <DialogDescription>
                    Create a custom rule to flag important log entries
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="rule-name">Rule Name</Label>
                    <Input
                      id="rule-name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Suspicious Login Activity"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="rule-description">Description</Label>
                    <Textarea
                      id="rule-description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Describe what this rule detects"
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="rule-pattern">Pattern</Label>
                    <Textarea
                      id="rule-pattern"
                      value={formData.pattern}
                      onChange={(e) => setFormData({ ...formData, pattern: e.target.value })}
                      placeholder="Text or regex pattern to match"
                      className="font-mono text-sm"
                      rows={3}
                    />
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={formData.isRegex}
                        onCheckedChange={(checked) => setFormData({ ...formData, isRegex: checked })}
                      />
                      <Label>Use Regular Expression</Label>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="rule-category">Category</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value: LogRule['category']) =>
                          setFormData({ ...formData, category: value })
                        }
                      >
                        <SelectTrigger id="rule-category">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="security">Security</SelectItem>
                          <SelectItem value="system-failure">System Failure</SelectItem>
                          <SelectItem value="network">Network</SelectItem>
                          <SelectItem value="custom">Custom</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="rule-severity">Severity</Label>
                      <Select
                        value={formData.severity}
                        onValueChange={(value: LogRule['severity']) =>
                          setFormData({ ...formData, severity: value })
                        }
                      >
                        <SelectTrigger id="rule-severity">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="critical">Critical</SelectItem>
                          <SelectItem value="warning">Warning</SelectItem>
                          <SelectItem value="info">Info</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => {
                    setIsDialogOpen(false);
                    setEditingRule(null);
                    resetForm();
                  }}>
                    Cancel
                  </Button>
                  <Button onClick={editingRule ? handleUpdateRule : handleAddRule}>
                    {editingRule ? 'Update Rule' : 'Add Rule'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-3">
            {rules.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>No rules defined yet.</p>
                <p className="text-sm mt-2">Add custom rules or load preset rules to get started.</p>
              </div>
            ) : (
              rules.map((rule) => (
                <Card key={rule.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <Switch
                      checked={rule.enabled}
                      onCheckedChange={() => handleToggleRule(rule.id)}
                    />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm">{rule.name}</h3>
                        {rule.preset && (
                          <Badge variant="secondary" className="text-xs">
                            Preset
                          </Badge>
                        )}
                        <Badge
                          variant="outline"
                          className="text-xs flex items-center gap-1"
                        >
                          {getCategoryIcon(rule.category)}
                          {rule.category}
                        </Badge>
                        <Badge
                          className={`text-xs ${
                            rule.severity === 'critical'
                              ? 'bg-red-500'
                              : rule.severity === 'warning'
                              ? 'bg-yellow-500'
                              : 'bg-blue-500'
                          }`}
                        >
                          {rule.severity}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {rule.description}
                      </p>
                      <div className="font-mono text-xs bg-secondary/50 p-2 rounded">
                        {rule.pattern}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditRule(rule)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteRule(rule.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    </Card>
  );
}
