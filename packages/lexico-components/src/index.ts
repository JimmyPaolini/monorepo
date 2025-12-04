// Utilities
export { cn } from "./generated/utils/utils";

// Hooks
export {
  useMediaQuery,
  useBreakpoint,
  breakpoints,
} from "./hooks/use-media-query";

// UI Components
export {
  Button,
  buttonVariants,
  type ButtonProps,
} from "./generated/ui/button";
export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
} from "./generated/ui/card";
export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "./generated/ui/dialog";
export { Input } from "./generated/ui/input";
export { Label } from "./generated/ui/label";
export { Separator } from "./generated/ui/separator";
export { Textarea } from "./generated/ui/textarea";

// Entry Components
export {
  AdjectiveFormsTable,
  type AdjectiveForm,
  type AdjectiveFormsTableProps,
  EntryCard,
  type EntryCardProps,
  FormCell,
  type FormCellProps,
  type FormCellPosition,
  FormTabs,
  type FormTabsProps,
  Forms,
  type FormsProps,
  type FormsData,
  FormsTable,
  type FormsTableProps,
  Identifier,
  type IdentifierProps,
  abbreviations,
  identifierStyles,
  NounFormsTable,
  type NounForm,
  type NounFormsTableProps,
  PrincipalParts,
  type PrincipalPartsProps,
  type PrincipalPart,
  type PartOfSpeech,
  type Inflection,
  type NounInflection,
  type VerbInflection,
  type AdjectiveInflection,
  type AdverbInflection,
  type PrepositionInflection,
  type Uninflected,
  getInflectionLabel,
  getPrincipalPartsLabel,
  Translations,
  type TranslationsProps,
  VerbFormsTable,
  type VerbForm,
  type VerbFormsTableProps,
} from "./components/entry";

// Layout Components
export {
  Deck,
  type DeckProps,
  Layout,
  type LayoutProps,
  Logo,
  type LogoProps,
  Navigation,
  defaultNavItems,
  type NavigationProps,
  type NavItem,
  SearchBar,
  type SearchBarProps,
} from "./components/layout";
