'use client';

import { useState, useEffect } from 'react';
import { Sparkles, Wand2, Lightbulb, ChevronDown, ChevronUp } from 'lucide-react';
import api, { getErrorMessage } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';

interface AIAssistantProps {
  topic?: string;
  currentContent?: string;
  onInsertContent: (content: string) => void;
}

export function AIAssistant({ topic, currentContent, onInsertContent }: AIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [aiTopic, setAiTopic] = useState(topic || '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isImproving, setIsImproving] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [headings, setHeadings] = useState<string[]>([]);
  const [tone, setTone] = useState('professional');

  // Sync topic when the post title changes
  useEffect(() => {
    if (topic && topic !== aiTopic) {
      setAiTopic(topic);
    }
  }, [topic]);

  const handleGenerate = async () => {
    if (!aiTopic.trim()) {
      toast.error('Please enter a topic first');
      return;
    }
    setIsGenerating(true);
    try {
      const res = await api.post('/ai/generate', { topic: aiTopic, tone });
      onInsertContent(res.data.data.content);
      toast.success('Content generated!');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleImprove = async () => {
    const plainText = currentContent?.replace(/<[^>]*>/g, '').trim() || '';
    if (plainText.length < 10) {
      toast.error('Write some content first to improve it');
      return;
    }
    setIsImproving(true);
    try {
      const res = await api.post('/ai/improve', {
        text: plainText.substring(0, 1000),
        instruction: 'improve clarity, flow, and engagement',
      });
      onInsertContent(res.data.data.improved);
      toast.success('Content improved!');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsImproving(false);
    }
  };

  const handleSuggestHeadings = async () => {
    if (!aiTopic.trim()) {
      toast.error('Please enter a topic first');
      return;
    }
    setIsSuggesting(true);
    try {
      const res = await api.post('/ai/suggest-headings', { topic: aiTopic, count: 6 });
      setHeadings(res.data.data.headings);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSuggesting(false);
    }
  };

  return (
    <div className="border border-border rounded-2xl overflow-hidden bg-card">
      {/* Header toggle */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-medium text-sm">AI Writing Assistant</span>
          <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">Beta</span>
        </div>
        {isOpen
          ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
          : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {isOpen && (
        <div className="px-5 pb-5 space-y-4 border-t border-border">
          {/* Topic */}
          <div className="pt-4">
            <label className="block text-sm font-medium mb-1.5">Topic / Title</label>
            <input
              type="text"
              value={aiTopic}
              onChange={(e) => setAiTopic(e.target.value)}
              placeholder="e.g., The future of AI in healthcare"
              className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Tone */}
          <div>
            <label className="block text-sm font-medium mb-1.5">Writing Tone</label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="professional">Professional</option>
              <option value="casual">Casual</option>
              <option value="educational">Educational</option>
              <option value="persuasive">Persuasive</option>
              <option value="storytelling">Storytelling</option>
            </select>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-1 gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={handleGenerate}
              isLoading={isGenerating}
              className="justify-start gap-2"
            >
              <Wand2 className="w-4 h-4" />
              Generate content from topic
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={handleImprove}
              isLoading={isImproving}
              className="justify-start gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Improve current writing
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={handleSuggestHeadings}
              isLoading={isSuggesting}
              className="justify-start gap-2"
            >
              <Lightbulb className="w-4 h-4" />
              Suggest headings
            </Button>
          </div>

          {/* Heading suggestions */}
          {headings.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Suggested Headings — click to insert
              </p>
              {headings.map((heading, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => onInsertContent(`<h2>${heading}</h2><p></p>`)}
                  className="w-full text-left px-3 py-2 text-sm bg-muted/50 hover:bg-muted rounded-xl transition-colors"
                >
                  {heading}
                </button>
              ))}
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            💡 AI content is a starting point — always review before publishing.
          </p>
        </div>
      )}
    </div>
  );
}
