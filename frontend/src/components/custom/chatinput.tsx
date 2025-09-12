import { cx } from 'classix';
import { toast } from 'sonner';
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { Send, Loader } from "lucide-react";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch"; // Assuming you have a Switch component
import { memo, useEffect, useState } from 'react'; // Import memo
import { Combobox } from '../ui/combobox';

interface ChatInputProps {
  snps: string[];
  traits: string[];
  categories: string[];
  isLoading: boolean;
  onValidate: (snp: string, trait: string) => void;
  onSuggest: (topic: string) => void;
}

// Wrap the component in React.memo
export const ChatInput = memo(({
  snps,
  traits,
  categories,
  isLoading,
  onValidate,
  onSuggest,
}: ChatInputProps) => {
  const [isDesktop, setIsDesktop] = useState(false);
  const [isSuggestMode, setSuggestMode] = useState(false);
  const [selectedSnp, setSelectedSnp] = useState("");
  const [selectedTrait, setSelectedTrait] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  useEffect(() => {
    const checkScreenSize = () => {
      setIsDesktop(window.innerWidth >= 768);
    };
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);



  const snpOptions = snps.map(s => ({ value: s, label: s }));
  const traitOptions = traits.map(t => ({ value: t, label: t.replace(/_/g, ' ') }));
  const categoryOptions = categories.map(c => ({ value: c, label: c }));

  const handleValidate = () => {
    if (selectedSnp && selectedTrait) {
      onValidate(selectedSnp, selectedTrait);
    }
  };

  const handleSuggest = () => {
    if (selectedCategory) {
      onSuggest(selectedCategory);
    }
  };

  return (
    <div className="relative w-full flex flex-col gap-4">
      <input
        type="file"
        className="fixed -top-4 -left-4 size-0.5 opacity-0 pointer-events-none"
        multiple
        tabIndex={-1}
      />

      <div className="absolute top-[-30px] right-0 flex items-center space-x-2">
        <Label htmlFor="suggest-mode">Suggest Hypotheses</Label>
        <Switch
          id="suggest-mode"
          checked={isSuggestMode}
          onCheckedChange={setSuggestMode}
        />
      </div>
      {isSuggestMode ? (
        // AI Suggestion Mode
        <div className="flex items-center gap-2">
          <Combobox
            options={categoryOptions}
            value={selectedCategory}
            onSelect={setSelectedCategory}
            placeholder="Select a topic..."
            searchPlaceholder="Search topics..."
            emptyPlaceholder="No topics found."
            className="flex-1"
          />
          <Button onClick={handleSuggest} disabled={isLoading || !selectedCategory}>
            {isLoading ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            Suggest
          </Button>
        </div>
      ) : (
        // Manual Validation Mode
        <div className="space-y-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <Combobox
              options={snpOptions}
              value={selectedSnp}
              onSelect={setSelectedSnp}
              placeholder="Select SNP..."
              searchPlaceholder="Search SNPs..."
              emptyPlaceholder="No SNPs found."
            />
            <Combobox
              options={traitOptions}
              value={selectedTrait}
              onSelect={setSelectedTrait}
              placeholder="Select Trait..."
              searchPlaceholder="Search traits..."
              emptyPlaceholder="No traits found."
            />
          </div>
          <Button onClick={handleValidate} disabled={isLoading || !selectedSnp || !selectedTrait} className="w-full">
            {isLoading ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            Validate Association
          </Button>
        </div>
      )}
    </div>
  );
});