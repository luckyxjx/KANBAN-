import React from 'react';

interface IconProps {
  className?: string;
  color?: string;
  size?: number;
}

// Kanban Board Icon - Custom designed for the project
export const KanbanIcon: React.FC<IconProps> = ({ className, color = 'currentColor', size = 24 }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none">
    <defs>
      <linearGradient id="kanban-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#5779a6" />
        <stop offset="100%" stopColor="#4f678e" />
      </linearGradient>
    </defs>
    {/* Board background */}
    <rect x="2" y="3" width="20" height="18" rx="3" ry="3" fill="url(#kanban-gradient)" opacity="0.1" stroke={color} strokeWidth="1.5"/>
    
    {/* Column 1 */}
    <rect x="4" y="6" width="4.5" height="12" rx="1.5" fill="url(#kanban-gradient)" opacity="0.8"/>
    <rect x="5" y="8" width="2.5" height="2" rx="0.5" fill="white"/>
    <rect x="5" y="11" width="2.5" height="1.5" rx="0.5" fill="white"/>
    
    {/* Column 2 */}
    <rect x="9.75" y="6" width="4.5" height="12" rx="1.5" fill={color} opacity="0.6"/>
    <rect x="10.75" y="8" width="2.5" height="2" rx="0.5" fill="white"/>
    <rect x="10.75" y="11" width="2.5" height="1.5" rx="0.5" fill="white"/>
    <rect x="10.75" y="14" width="2.5" height="1.5" rx="0.5" fill="white"/>
    
    {/* Column 3 */}
    <rect x="15.5" y="6" width="4.5" height="12" rx="1.5" fill={color} opacity="0.4"/>
    <rect x="16.5" y="8" width="2.5" height="2" rx="0.5" fill="white"/>
  </svg>
);

// Document Icon - Custom designed
export const DocumentIcon: React.FC<IconProps> = ({ className, color = 'currentColor', size = 24 }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none">
    <defs>
      <linearGradient id="doc-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#5779a6" />
        <stop offset="100%" stopColor="#4f678e" />
      </linearGradient>
    </defs>
    {/* Document body */}
    <path d="M6 2h8l6 6v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" fill="url(#doc-gradient)" opacity="0.1" stroke={color} strokeWidth="1.5"/>
    {/* Folded corner */}
    <path d="M14 2v6h6" stroke={color} strokeWidth="1.5" fill="none"/>
    {/* Text lines */}
    <line x1="8" y1="12" x2="16" y2="12" stroke={color} strokeWidth="1.5" opacity="0.7"/>
    <line x1="8" y1="15" x2="16" y2="15" stroke={color} strokeWidth="1.5" opacity="0.7"/>
    <line x1="8" y1="18" x2="13" y2="18" stroke={color} strokeWidth="1.5" opacity="0.7"/>
  </svg>
);

// User Icon - Custom designed with modern avatar style
export const UserIcon: React.FC<IconProps> = ({ className, color = 'currentColor', size = 24 }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none">
    <defs>
      <linearGradient id="user-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#5779a6" />
        <stop offset="100%" stopColor="#4f678e" />
      </linearGradient>
    </defs>
    {/* Head */}
    <circle cx="12" cy="8" r="4" fill="url(#user-gradient)" opacity="0.8"/>
    {/* Body */}
    <path d="M6 21v-2a6 6 0 0 1 12 0v2" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round"/>
    {/* Highlight on head */}
    <circle cx="10.5" cy="6.5" r="1" fill="white" opacity="0.3"/>
  </svg>
);

// Settings/Gear Icon - Custom designed
export const SettingsIcon: React.FC<IconProps> = ({ className, color = 'currentColor', size = 24 }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none">
    <defs>
      <linearGradient id="settings-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#5779a6" />
        <stop offset="100%" stopColor="#4f678e" />
      </linearGradient>
    </defs>
    {/* Outer gear */}
    <path d="M12 1l3 2 3-1 1 3 2 1-1 3 1 3-2 1-1 3-3-1-3 2-3-2-3 1-1-3-2-1 1-3-1-3 2-1 1-3 3 1z" fill="url(#settings-gradient)" opacity="0.2" stroke={color} strokeWidth="1.5"/>
    {/* Inner circle */}
    <circle cx="12" cy="12" r="4" fill="none" stroke={color} strokeWidth="1.5"/>
    {/* Center dot */}
    <circle cx="12" cy="12" r="1.5" fill={color}/>
  </svg>
);

// Dashboard/Grid Icon - Custom designed
export const DashboardIcon: React.FC<IconProps> = ({ className, color = 'currentColor', size = 24 }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none">
    <defs>
      <linearGradient id="dashboard-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#5779a6" />
        <stop offset="100%" stopColor="#4f678e" />
      </linearGradient>
    </defs>
    {/* Grid squares */}
    <rect x="3" y="3" width="7" height="7" rx="2" fill="url(#dashboard-gradient)" opacity="0.8"/>
    <rect x="14" y="3" width="7" height="7" rx="2" fill={color} opacity="0.6"/>
    <rect x="3" y="14" width="7" height="7" rx="2" fill={color} opacity="0.6"/>
    <rect x="14" y="14" width="7" height="7" rx="2" fill={color} opacity="0.4"/>
    
    {/* Highlights */}
    <rect x="4" y="4" width="2" height="2" rx="0.5" fill="white" opacity="0.3"/>
    <rect x="15" y="4" width="2" height="2" rx="0.5" fill="white" opacity="0.3"/>
  </svg>
);

// Activity/Chart Icon - Custom designed
export const ActivityIcon: React.FC<IconProps> = ({ className, color = 'currentColor', size = 24 }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none">
    <defs>
      <linearGradient id="activity-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#5779a6" />
        <stop offset="100%" stopColor="#4f678e" />
      </linearGradient>
    </defs>
    {/* Chart bars */}
    <rect x="4" y="14" width="3" height="6" rx="1.5" fill="url(#activity-gradient)" opacity="0.8"/>
    <rect x="8.5" y="10" width="3" height="10" rx="1.5" fill="url(#activity-gradient)" opacity="0.9"/>
    <rect x="13" y="6" width="3" height="14" rx="1.5" fill="url(#activity-gradient)"/>
    <rect x="17.5" y="12" width="3" height="8" rx="1.5" fill={color} opacity="0.7"/>
    
    {/* Trend line */}
    <path d="M3 18 L7 14 L11 10 L15 6 L19 8 L21 6" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.6"/>
  </svg>
);

// Members/Team Icon - Custom designed
export const MembersIcon: React.FC<IconProps> = ({ className, color = 'currentColor', size = 24 }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none">
    <defs>
      <linearGradient id="members-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#5779a6" />
        <stop offset="100%" stopColor="#4f678e" />
      </linearGradient>
    </defs>
    {/* Person 1 */}
    <circle cx="9" cy="7" r="3" fill="url(#members-gradient)" opacity="0.8"/>
    <path d="M3 21v-2a6 6 0 0 1 12 0v2" stroke={color} strokeWidth="1.5" fill="none"/>
    
    {/* Person 2 (overlapping) */}
    <circle cx="15" cy="7" r="3" fill={color} opacity="0.6"/>
    <path d="M21 21v-2a6 6 0 0 0-6-6" stroke={color} strokeWidth="1.5" fill="none"/>
    
    {/* Highlights */}
    <circle cx="7.5" cy="5.5" r="0.8" fill="white" opacity="0.4"/>
    <circle cx="13.5" cy="5.5" r="0.8" fill="white" opacity="0.4"/>
  </svg>
);

// Workspace/Building Icon - Custom designed
export const WorkspaceIcon: React.FC<IconProps> = ({ className, color = 'currentColor', size = 24 }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none">
    <defs>
      <linearGradient id="workspace-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#5779a6" />
        <stop offset="100%" stopColor="#4f678e" />
      </linearGradient>
    </defs>
    {/* Building base */}
    <rect x="4" y="8" width="16" height="13" rx="2" fill="url(#workspace-gradient)" opacity="0.1" stroke={color} strokeWidth="1.5"/>
    
    {/* Building top */}
    <path d="M6 8 L12 3 L18 8" fill="url(#workspace-gradient)" opacity="0.8"/>
    
    {/* Windows */}
    <rect x="7" y="11" width="2" height="2" rx="0.5" fill={color} opacity="0.6"/>
    <rect x="11" y="11" width="2" height="2" rx="0.5" fill={color} opacity="0.6"/>
    <rect x="15" y="11" width="2" height="2" rx="0.5" fill={color} opacity="0.6"/>
    
    <rect x="7" y="15" width="2" height="2" rx="0.5" fill={color} opacity="0.6"/>
    <rect x="11" y="15" width="2" height="2" rx="0.5" fill={color} opacity="0.6"/>
    <rect x="15" y="15" width="2" height="2" rx="0.5" fill={color} opacity="0.6"/>
    
    {/* Door */}
    <rect x="11" y="18" width="2" height="3" rx="1" fill={color}/>
  </svg>
);

// Plus/Add Icon - Custom designed
export const PlusIcon: React.FC<IconProps> = ({ className, color = 'currentColor', size = 24 }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none">
    <defs>
      <linearGradient id="plus-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#5779a6" />
        <stop offset="100%" stopColor="#4f678e" />
      </linearGradient>
    </defs>
    {/* Background circle */}
    <circle cx="12" cy="12" r="10" fill="url(#plus-gradient)" opacity="0.1" stroke={color} strokeWidth="1.5"/>
    
    {/* Plus sign */}
    <line x1="12" y1="8" x2="12" y2="16" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
    <line x1="8" y1="12" x2="16" y2="12" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
  </svg>
);

// Close/X Icon - Custom designed
export const CloseIcon: React.FC<IconProps> = ({ className, color = 'currentColor', size = 24 }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none">
    <defs>
      <linearGradient id="close-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ef4444" />
        <stop offset="100%" stopColor="#dc2626" />
      </linearGradient>
    </defs>
    {/* Background circle */}
    <circle cx="12" cy="12" r="10" fill="url(#close-gradient)" opacity="0.1" stroke={color} strokeWidth="1.5"/>
    
    {/* X mark */}
    <line x1="15" y1="9" x2="9" y2="15" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <line x1="9" y1="9" x2="15" y2="15" stroke={color} strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

// Check/Success Icon - Custom designed
export const CheckIcon: React.FC<IconProps> = ({ className, color = 'currentColor', size = 24 }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none">
    <defs>
      <linearGradient id="check-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#10b981" />
        <stop offset="100%" stopColor="#059669" />
      </linearGradient>
    </defs>
    {/* Background circle */}
    <circle cx="12" cy="12" r="10" fill="url(#check-gradient)" opacity="0.1" stroke={color} strokeWidth="1.5"/>
    
    {/* Check mark */}
    <path d="M9 12l2 2 4-4" stroke={color} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Arrow Down Icon - Custom designed
export const ArrowDownIcon: React.FC<IconProps> = ({ className, color = 'currentColor', size = 24 }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M6 9l6 6 6-6" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Chevron Down Icon - Custom designed
export const ChevronDownIcon: React.FC<IconProps> = ({ className, color = 'currentColor', size = 24 }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M6 9l6 6 6-6" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Theme/Moon Icon - Custom designed
export const MoonIcon: React.FC<IconProps> = ({ className, color = 'currentColor', size = 24 }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none">
    <defs>
      <linearGradient id="moon-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#5779a6" />
        <stop offset="100%" stopColor="#4f678e" />
      </linearGradient>
    </defs>
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill="url(#moon-gradient)" opacity="0.8"/>
    {/* Craters */}
    <circle cx="10" cy="8" r="1" fill={color} opacity="0.3"/>
    <circle cx="8" cy="12" r="0.5" fill={color} opacity="0.3"/>
    <circle cx="12" cy="14" r="0.8" fill={color} opacity="0.3"/>
  </svg>
);

// Sun Icon - Custom designed
export const SunIcon: React.FC<IconProps> = ({ className, color = 'currentColor', size = 24 }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none">
    <defs>
      <linearGradient id="sun-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f59e0b" />
        <stop offset="100%" stopColor="#d97706" />
      </linearGradient>
    </defs>
    {/* Sun center */}
    <circle cx="12" cy="12" r="5" fill="url(#sun-gradient)" opacity="0.8"/>
    
    {/* Sun rays */}
    <line x1="12" y1="1" x2="12" y2="3" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <line x1="12" y1="21" x2="12" y2="23" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <line x1="1" y1="12" x2="3" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <line x1="21" y1="12" x2="23" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" stroke={color} strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

// Loading/Spinner Icon - Custom designed
export const LoadingIcon: React.FC<IconProps> = ({ className, color = 'currentColor', size = 24 }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none">
    <defs>
      <linearGradient id="loading-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor={color} stopOpacity="0"/>
        <stop offset="100%" stopColor={color} stopOpacity="1"/>
      </linearGradient>
    </defs>
    <circle cx="12" cy="12" r="10" stroke="url(#loading-gradient)" strokeWidth="2" fill="none" strokeLinecap="round">
      <animateTransform
        attributeName="transform"
        attributeType="XML"
        type="rotate"
        from="0 12 12"
        to="360 12 12"
        dur="1s"
        repeatCount="indefinite"
      />
    </circle>
  </svg>
);

// Background Icons for Login Page
export const PenIcon: React.FC<IconProps> = ({ className, color = 'currentColor', size = 24 }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" fill={color} opacity="0.6"/>
    <path d="M15 5l4 4" stroke="white" strokeWidth="1" opacity="0.8"/>
  </svg>
);

export const BookIcon: React.FC<IconProps> = ({ className, color = 'currentColor', size = 24 }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15z" fill={color} opacity="0.6"/>
    <line x1="8" y1="6" x2="16" y2="6" stroke="white" strokeWidth="1" opacity="0.8"/>
    <line x1="8" y1="9" x2="16" y2="9" stroke="white" strokeWidth="1" opacity="0.8"/>
    <line x1="8" y1="12" x2="13" y2="12" stroke="white" strokeWidth="1" opacity="0.8"/>
  </svg>
);

export const DesktopIcon: React.FC<IconProps> = ({ className, color = 'currentColor', size = 24 }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect x="2" y="3" width="20" height="14" rx="2" fill={color} opacity="0.6"/>
    <rect x="4" y="5" width="16" height="10" rx="1" fill="white" opacity="0.9"/>
    <line x1="8" y1="21" x2="16" y2="21" stroke={color} strokeWidth="2"/>
    <line x1="12" y1="17" x2="12" y2="21" stroke={color} strokeWidth="2"/>
  </svg>
);

export const CalendarIcon: React.FC<IconProps> = ({ className, color = 'currentColor', size = 24 }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect x="3" y="4" width="18" height="18" rx="2" fill={color} opacity="0.6"/>
    <rect x="3" y="10" width="18" height="2" fill="white" opacity="0.9"/>
    <line x1="16" y1="2" x2="16" y2="6" stroke={color} strokeWidth="2"/>
    <line x1="8" y1="2" x2="8" y2="6" stroke={color} strokeWidth="2"/>
    <circle cx="8" cy="14" r="1" fill="white" opacity="0.8"/>
    <circle cx="12" cy="14" r="1" fill="white" opacity="0.8"/>
    <circle cx="16" cy="14" r="1" fill="white" opacity="0.8"/>
  </svg>
);

export const ChecklistIcon: React.FC<IconProps> = ({ className, color = 'currentColor', size = 24 }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect x="3" y="3" width="18" height="18" rx="2" fill={color} opacity="0.6"/>
    <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2" fill="none"/>
    <line x1="7" y1="8" x2="17" y2="8" stroke="white" strokeWidth="1" opacity="0.8"/>
    <line x1="7" y1="16" x2="17" y2="16" stroke="white" strokeWidth="1" opacity="0.8"/>
  </svg>
);

export const ClockIcon: React.FC<IconProps> = ({ className, color = 'currentColor', size = 24 }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" fill={color} opacity="0.6"/>
    <circle cx="12" cy="12" r="8" fill="white" opacity="0.9"/>
    <line x1="12" y1="6" x2="12" y2="12" stroke={color} strokeWidth="2"/>
    <line x1="12" y1="12" x2="16" y2="14" stroke={color} strokeWidth="2"/>
    <circle cx="12" cy="12" r="1" fill={color}/>
  </svg>
);

export const CodeArrowsIcon: React.FC<IconProps> = ({ className, color = 'currentColor', size = 24 }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M16 18l6-6-6-6" stroke={color} strokeWidth="2" fill="none"/>
    <path d="M8 6l-6 6 6 6" stroke={color} strokeWidth="2" fill="none"/>
    <circle cx="12" cy="12" r="2" fill={color} opacity="0.6"/>
  </svg>
);

export const GridIcon: React.FC<IconProps> = ({ className, color = 'currentColor', size = 24 }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect x="3" y="3" width="7" height="7" rx="1" fill={color} opacity="0.6"/>
    <rect x="14" y="3" width="7" height="7" rx="1" fill={color} opacity="0.4"/>
    <rect x="3" y="14" width="7" height="7" rx="1" fill={color} opacity="0.4"/>
    <rect x="14" y="14" width="7" height="7" rx="1" fill={color} opacity="0.6"/>
  </svg>
);

export const BooksIcon: React.FC<IconProps> = ({ className, color = 'currentColor', size = 24 }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect x="4" y="4" width="3" height="16" rx="1" fill={color} opacity="0.8"/>
    <rect x="8" y="3" width="3" height="18" rx="1" fill={color} opacity="0.6"/>
    <rect x="12" y="5" width="3" height="14" rx="1" fill={color} opacity="0.4"/>
    <rect x="16" y="6" width="3" height="12" rx="1" fill={color} opacity="0.7"/>
  </svg>
);

export const StickyNoteIcon: React.FC<IconProps> = ({ className, color = 'currentColor', size = 24 }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M3 3h14l4 4v14H3z" fill={color} opacity="0.6"/>
    <path d="M17 3v4h4" fill="white" opacity="0.9"/>
    <line x1="6" y1="9" x2="14" y2="9" stroke="white" strokeWidth="1" opacity="0.8"/>
    <line x1="6" y1="12" x2="14" y2="12" stroke="white" strokeWidth="1" opacity="0.8"/>
    <line x1="6" y1="15" x2="11" y2="15" stroke="white" strokeWidth="1" opacity="0.8"/>
  </svg>
);

export const ProgressBarIcon: React.FC<IconProps> = ({ className, color = 'currentColor', size = 24 }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect x="2" y="10" width="20" height="4" rx="2" fill={color} opacity="0.3"/>
    <rect x="2" y="10" width="14" height="4" rx="2" fill={color} opacity="0.8"/>
    <circle cx="16" cy="12" r="3" fill="white" opacity="0.9"/>
    <circle cx="16" cy="12" r="1" fill={color}/>
  </svg>
);

export const GraphIcon: React.FC<IconProps> = ({ className, color = 'currentColor', size = 24 }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect x="3" y="3" width="18" height="18" rx="2" fill={color} opacity="0.1"/>
    <path d="M7 14l3-3 3 2 4-4" stroke={color} strokeWidth="2" fill="none"/>
    <circle cx="7" cy="14" r="2" fill={color} opacity="0.8"/>
    <circle cx="10" cy="11" r="2" fill={color} opacity="0.6"/>
    <circle cx="13" cy="13" r="2" fill={color} opacity="0.7"/>
    <circle cx="17" cy="9" r="2" fill={color} opacity="0.9"/>
  </svg>
);

export const SyncIcon: React.FC<IconProps> = ({ className, color = 'currentColor', size = 24 }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M23 4v6h-6" stroke={color} strokeWidth="2" fill="none"/>
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" stroke={color} strokeWidth="2" fill="none"/>
    <circle cx="12" cy="12" r="2" fill={color} opacity="0.6"/>
  </svg>
);

export const DatabaseIcon: React.FC<IconProps> = ({ className, color = 'currentColor', size = 24 }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none">
    <ellipse cx="12" cy="5" rx="9" ry="3" fill={color} opacity="0.6"/>
    <ellipse cx="12" cy="12" rx="9" ry="3" fill={color} opacity="0.4"/>
    <ellipse cx="12" cy="19" rx="9" ry="3" fill={color} opacity="0.8"/>
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" stroke={color} strokeWidth="1.5" fill="none"/>
  </svg>
);

export const ApiNodesIcon: React.FC<IconProps> = ({ className, color = 'currentColor', size = 24 }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="3" fill={color} opacity="0.8"/>
    <circle cx="6" cy="6" r="2" fill={color} opacity="0.6"/>
    <circle cx="18" cy="6" r="2" fill={color} opacity="0.6"/>
    <circle cx="6" cy="18" r="2" fill={color} opacity="0.6"/>
    <circle cx="18" cy="18" r="2" fill={color} opacity="0.6"/>
    <line x1="9" y1="9" x2="8" y2="8" stroke={color} strokeWidth="1.5"/>
    <line x1="15" y1="9" x2="16" y2="8" stroke={color} strokeWidth="1.5"/>
    <line x1="9" y1="15" x2="8" y2="16" stroke={color} strokeWidth="1.5"/>
    <line x1="15" y1="15" x2="16" y2="16" stroke={color} strokeWidth="1.5"/>
  </svg>
);

export const CloudIcon: React.FC<IconProps> = ({ className, color = 'currentColor', size = 24 }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" fill={color} opacity="0.6"/>
    <circle cx="10" cy="12" r="1" fill="white" opacity="0.8"/>
    <circle cx="14" cy="14" r="1" fill="white" opacity="0.8"/>
    <circle cx="12" cy="10" r="0.5" fill="white" opacity="0.8"/>
  </svg>
);