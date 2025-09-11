import { Button } from "../ui/button";
import { cn } from "@/lib/utils";
import { PanelLeftClose, FlaskConical } from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onValidateClick: (snp: string, trait: string) => void;
}

const validationExamples = [
  { snp: "rs2543600", trait: "age_at_death", label: "Age at Death" },
  { snp: "rs12931267", trait: "red_hair", label: "Red Hair" },
  { snp: "rs726914", trait: "systolic_blood_pressure", label: "Blood Pressure" },
  { snp: "rs2229238", trait: "interleukin_6_receptor", label: "IL-6 Receptor" },
  { snp: "rs599839", trait: "ldl", label: "LDL Cholesterol" },
  { snp: "rs12203592", trait: "freckling", label: "Freckling" },
];

export function Sidebar({ isOpen, onClose, onValidateClick }: SidebarProps) {
  return (
    <div
      className={cn(
        "fixed inset-y-0 left-0 z-30 w-64 bg-card border-r transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold">Quick Tests</h2>
        <Button variant="ghost" size="icon" onClick={onClose} className="md:hidden">
          <PanelLeftClose className="h-5 w-5" />
        </Button>
      </div>
      <div className="p-4 space-y-2">
        {validationExamples.map((ex, index) => (
          <Button
            key={index}
            variant="ghost"
            className="w-full justify-start"
            onClick={() => {
              onValidateClick(ex.snp, ex.trait);
              if (window.innerWidth < 768) onClose();
            }}
          >
            <FlaskConical className="mr-2 h-4 w-4" />
            {ex.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
