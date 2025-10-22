import { useTranslation } from 'react-i18next';
import { languages, type SupportedLanguage } from '../i18n/config';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/DropdownMenu';
import { Button } from './ui/Button';
import { Globe } from 'lucide-react';

export function LocaleSwitcher() {
  const { i18n } = useTranslation();
  
  const currentLanguage = i18n.language as SupportedLanguage;
  const currentLanguageData = languages[currentLanguage] || languages['en-GB'];

  const changeLanguage = (lng: SupportedLanguage) => {
    i18n.changeLanguage(lng);
    // Update HTML lang attribute
    document.documentElement.lang = lng;
    // Update HTML dir attribute for RTL support
    document.documentElement.dir = lng === 'ar' || lng === 'he' ? 'rtl' : 'ltr';
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          <Globe className="mr-2 h-4 w-4" />
          <span className="mr-1">{currentLanguageData.flag}</span>
          {currentLanguageData.nativeName}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {Object.entries(languages).map(([code, lang]) => (
          <DropdownMenuItem
            key={code}
            onClick={() => changeLanguage(code as SupportedLanguage)}
            className={currentLanguage === code ? 'bg-accent' : ''}
          >
            <span className="mr-2">{lang.flag}</span>
            <div className="flex flex-col">
              <span className="font-medium">{lang.nativeName}</span>
              <span className="text-xs text-muted-foreground">{lang.name}</span>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}