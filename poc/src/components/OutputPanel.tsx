import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import type { SpecArtifact } from '../types/spec.types';
import { AGENT_DISPLAY_NAMES } from '../types/spec.types';
import { Download, FileText, ChevronDown, ChevronRight, CheckCircle } from 'lucide-react';

interface OutputPanelProps {
  artifacts: SpecArtifact[];
  onDownload: () => void;
  canDownload: boolean;
}

export function OutputPanel({ artifacts, onDownload, canDownload }: OutputPanelProps) {
  const [selectedArtifact, setSelectedArtifact] = useState<SpecArtifact | null>(
    artifacts[0] || null
  );
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(['product', 'architect', 'scrum', 'developer', 'tester', 'devops'])
  );

  // Group artifacts by agent
  const groupedArtifacts = artifacts.reduce((acc, artifact) => {
    const agent = artifact.createdBy;
    if (!acc[agent]) {
      acc[agent] = [];
    }
    acc[agent].push(artifact);
    return acc;
  }, {} as Record<string, SpecArtifact[]>);

  const toggleGroup = (agent: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(agent)) {
        next.delete(agent);
      } else {
        next.add(agent);
      }
      return next;
    });
  };

  const agentOrder = ['product', 'architect', 'scrum', 'developer', 'tester', 'devops'];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Success Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-6 w-6" />
            Generation Complete
          </CardTitle>
          <CardDescription>
            Successfully generated {artifacts.length} spec artifacts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={onDownload} disabled={!canDownload} size="lg">
            <Download className="mr-2 h-4 w-4" />
            Download ZIP
          </Button>
        </CardContent>
      </Card>

      {/* File Browser and Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* File Tree */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Generated Files</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {agentOrder.map((agent) => {
                const agentArtifacts = groupedArtifacts[agent];
                if (!agentArtifacts || agentArtifacts.length === 0) return null;

                const isExpanded = expandedGroups.has(agent);

                return (
                  <div key={agent}>
                    <button
                      onClick={() => toggleGroup(agent)}
                      className="w-full flex items-center gap-2 px-4 py-3 hover:bg-muted/50 text-left"
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                      <span className="font-medium text-sm">
                        {AGENT_DISPLAY_NAMES[agent as keyof typeof AGENT_DISPLAY_NAMES]}
                      </span>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {agentArtifacts.length}
                      </span>
                    </button>

                    {isExpanded && (
                      <div className="bg-muted/30">
                        {agentArtifacts.map((artifact) => (
                          <button
                            key={artifact.filePath}
                            onClick={() => setSelectedArtifact(artifact)}
                            className={`w-full flex items-center gap-2 px-6 py-2 text-left text-sm hover:bg-muted/50 ${
                              selectedArtifact?.filePath === artifact.filePath
                                ? 'bg-primary/10 text-primary'
                                : ''
                            }`}
                          >
                            <FileText className="h-4 w-4 flex-shrink-0" />
                            <span className="truncate">{artifact.fileName}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* File Preview */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {selectedArtifact ? selectedArtifact.filePath : 'Select a file'}
            </CardTitle>
            {selectedArtifact && (
              <CardDescription>
                Created by {AGENT_DISPLAY_NAMES[selectedArtifact.createdBy]} | Version {selectedArtifact.version}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {selectedArtifact ? (
              <pre className="p-4 bg-muted rounded-lg overflow-auto max-h-[600px] text-sm font-mono whitespace-pre-wrap">
                {selectedArtifact.content}
              </pre>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                Select a file from the list to preview its contents
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
