import { Settings, Save } from 'lucide-react';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface OllamaConfigProps {
  config: {
    endpoint: string;
    model: string;
  };
  onConfigChange: (config: { endpoint: string; model: string }) => void;
}

export function OllamaConfig({ config, onConfigChange }: OllamaConfigProps) {
  const [endpoint, setEndpoint] = useState(config.endpoint);
  const [model, setModel] = useState(config.model);

  const handleSave = () => {
    onConfigChange({ endpoint, model });
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          <h2>Ollama Configuration</h2>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="endpoint">Ollama API Endpoint</Label>
            <Input
              id="endpoint"
              type="url"
              placeholder="http://localhost:11434"
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Default: http://localhost:11434 (Make sure Ollama is running locally)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="model">Model</Label>
            <Select value={model} onValueChange={setModel}>
              <SelectTrigger id="model">
                <SelectValue placeholder="Select model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="llama3.2">Llama 3.2</SelectItem>
                <SelectItem value="llama3.1">Llama 3.1</SelectItem>
                <SelectItem value="mistral">Mistral</SelectItem>
                <SelectItem value="phi3">Phi-3</SelectItem>
                <SelectItem value="gemma2">Gemma 2</SelectItem>
                <SelectItem value="qwen2.5">Qwen 2.5</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Pull models using: ollama pull {model}
            </p>
          </div>

          <Button onClick={handleSave} className="w-full">
            <Save className="w-4 h-4 mr-2" />
            Save Configuration
          </Button>
        </div>
      </div>
    </Card>
  );
}
