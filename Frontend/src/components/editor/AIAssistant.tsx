'use client';

import { useState, useEffect, useRef } from 'react';
import { Sparkles, Wand2, Lightbulb, ChevronDown, ChevronUp, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import api, { getErrorMessage } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';

interface AIAssistantProps {
  topic?: string;
  currentContent?: string;
  onInsertContent: (content: string) => void;
}

type AIStatus = 'idle' | 'connecting' | 'generating' | 'done' | 'error';

interface ProgressState {
  status: AIStatus;
  message: string;
  preview: string; // live preview of content being generated
  elapsed: number;
}

export function AIAssistant({ topic, currentContent, onInsertContent }: AIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [aiTopic, setAiTopic] = useState(topic || '');
  const [tone, setTone] = useState('professional');
  const [headings, setHeadings] = useState<string[]>([]);
  const [progress, setProgress] = useState<ProgressState>({
    status: 'idle', message: '', preview: '', elapsed: 0,
  });
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  // Sync topic when post title changes
  useEffect(() => {
    if (topic && topic !== aiTopic) setAiTopic(topic);
  }, [topic]); // eslint-disable-line react-hooks/exhaustive-deps

  // Elapsed time ticker
  useEffect(() => {
    if (progress.status === 'connecting' || progress.status === 'generating') {
      timerRef.current = setInterval(() => {
        setProgress(p => ({ ...p, elapsed: Math.floor((Date.now() - startTimeRef.current) / 1000) }));
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [progress.status]);

  const startProgress = (msg: string) => {
    startTimeRef.current = Date.now();
    setProgress({ status: 'connecting', message: msg, preview: '', elapsed: 0 });
  };

  const updateProgress = (msg: string, preview = '') => {
    setProgress(p => ({ ...p, status: 'generating', message: msg, preview }));
  };

  const doneProgress = () => {
    setProgress(p => ({ ...p, status: 'done', message: 'Done!' }));
    setTimeout(() => setProgress(p => ({ ...p, status: 'idle', message: '', preview: '' })), 2000);
  };

  const errorProgress = (msg: string) => {
    setProgress(p => ({ ...p, status: 'error', message: msg }));
    setTimeout(() => setProgress(p => ({ ...p, status: 'idle', message: '', preview: '' })), 4000);
  };

  const handleGenerate = async () => {
    if (!aiTopic.trim()) { toast.error('Please enter a topic first'); return; }

    startProgress('Connecting to AI...');
    try {
      updateProgress('AI is writing your blog post...', '');

      const res = await api.post('/ai/generate', { topic: aiTopic, tone }, { timeout: 90000 });
      const { content, source, model } = res.data.data;

      // Show preview of first 200 chars
      const plainPreview = content.replace(/<[^>]*>/g, '').substring(0, 200);
      updateProgress(`Generated via ${model || source}`, plainPreview);

      onInsertContent(content);
      doneProgress();
      toast.success(`Content generated${source === 'template' ? ' (template mode)' : ''}!`);
    } catch (error) {
      const msg = getErrorMessage(error);
      errorProgress(msg.includes('timeout') ? 'AI timed out — try again' : msg);
      toast.error('AI generation failed');
    }
  };

  const handleImprove = async () => {
    const plainText = currentContent?.replace(/<[^>]*>/g, '').trim() || '';
    if (plainText.length < 10) { toast.error('Write some content first'); return; }

    startProgress('Sending text to AI...');
    try {
      updateProgress('AI is improving your writing...');
      const res = await api.post('/ai/improve', {
        text: plainText.substring(0, 1000),
        instruction: 'improve clarity, flow, and engagement',
      }, { timeout: 90000 });
      onInsertContent(res.data.data.improved);
      doneProgress();
      toast.success('Writing improved!');
    } catch (error) {
      errorProgress(getErrorMessage(error));
      toast.error('AI improvement failed');
    }
  };

  const handleSuggestHeadings = async () => {
    if (!aiTopic.trim()) { toast.error('Please enter a topic first'); return; }

    startProgress('Generating heading ideas...');
    try {
      updateProgress('AI is brainstorming headings...');
      const res = await api.post('/ai/suggest-headings', { topic: aiTopic, count: 6 }, { timeout: 90000 });
      setHeadings(res.data.data.headings);
      doneProgress();
    } catch (error) {
      errorProgress(getErrorMessage(error));
      toast.error('Failed to generate headings');
    }
  };

  const isLoading = progress.status === 'connecting' || progress.status === 'generating';

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
              disabled={isLoading}
              className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
            />
          </div>

          {/* Tone */}
          <div>
            <label className="block text-sm font-medium mb-1.5">Writing Tone</label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              disabled={isLoading}
              className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
            >
              <option value="professional">Professional</option>
              <option value="casual">Casual</option>
              <option value="educational">Educational</option>
              <option value="persuasive">Persuasive</option>
              <option value="storytelling">Storytelling</option>
            </select>
          </div>

          {/* Progress Box — shows live status */}
          {progress.status !== 'idle' && (
            <div className={`rounded-xl p-3 text-sm border ${
              progress.status === 'error'
                ? 'bg-destructive/10 border-destructive/30 text-destructive'
                : progress.status === 'done'
                ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400'
                : 'bg-primary/5 border-primary/20 text-foreground'
            }`}>
              <div className="flex items-center gap-2 mb-1">
                {progress.status === 'error' ? (
                  <XCircle className="w-4 h-4 flex-shrink-0" />
                ) : progress.status === 'done' ? (
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                ) : (
                  <Loader2 className="w-4 h-4 flex-shrink-0 animate-spin text-primary" />
                )}
                <span className="font-medium">{progress.message}</span>
                {isLoading && (
                  <span className="ml-auto text-xs text-muted-foreground">{progress.elapsed}s</span>
                )}
              </div>
              {progress.preview && (
                <p className="text-xs text-muted-foreground mt-1.5 line-clamp-3 leading-relaxed border-t border-border/50 pt-1.5">
                  {progress.preview}...
                </p>
              )}
              {isLoading && (
                <div className="mt-2 h-1 bg-border rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full animate-pulse" style={{ width: '60%' }} />
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-1 gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={handleGenerate}
              isLoading={isLoading && progress.message.includes('blog post')}
              disabled={isLoading}
              className="justify-start gap-2"
            >
              <Wand2 className="w-4 h-4" />
              Generate content from topic
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={handleImprove}
              isLoading={isLoading && progress.message.includes('improving')}
              disabled={isLoading}
              className="justify-start gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Improve current writing
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={handleSuggestHeadings}
              isLoading={isLoading && progress.message.includes('headings')}
              disabled={isLoading}
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
