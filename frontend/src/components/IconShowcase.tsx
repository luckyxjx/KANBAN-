import React from 'react';
import {
  KanbanIcon,
  DocumentIcon,
  UserIcon,
  SettingsIcon,
  DashboardIcon,
  ActivityIcon,
  MembersIcon,
  WorkspaceIcon,
  PlusIcon,
  CloseIcon,
  CheckIcon,
  ArrowDownIcon,
  MoonIcon,
  SunIcon,
  LoadingIcon,
  PenIcon,
  BookIcon,
  DesktopIcon,
  CalendarIcon,
  ChecklistIcon,
  ClockIcon,
  CodeArrowsIcon,
  GridIcon,
  BooksIcon,
  StickyNoteIcon,
  ProgressBarIcon,
  GraphIcon,
  SyncIcon,
  DatabaseIcon,
  ApiNodesIcon,
  CloudIcon
} from './icons';

const IconShowcase: React.FC = () => {
  const icons = [
    { name: 'Kanban', component: KanbanIcon, description: 'Main Kanban board icon' },
    { name: 'Document', component: DocumentIcon, description: 'Document and file icon' },
    { name: 'User', component: UserIcon, description: 'User profile icon' },
    { name: 'Settings', component: SettingsIcon, description: 'Settings and configuration' },
    { name: 'Dashboard', component: DashboardIcon, description: 'Dashboard grid view' },
    { name: 'Activity', component: ActivityIcon, description: 'Activity and analytics' },
    { name: 'Members', component: MembersIcon, description: 'Team members icon' },
    { name: 'Workspace', component: WorkspaceIcon, description: 'Workspace building icon' },
    { name: 'Plus', component: PlusIcon, description: 'Add/create new items' },
    { name: 'Close', component: CloseIcon, description: 'Close and cancel actions' },
    { name: 'Check', component: CheckIcon, description: 'Success and confirmation' },
    { name: 'Arrow Down', component: ArrowDownIcon, description: 'Dropdown indicator' },
    { name: 'Moon', component: MoonIcon, description: 'Dark theme toggle' },
    { name: 'Sun', component: SunIcon, description: 'Light theme toggle' },
    { name: 'Loading', component: LoadingIcon, description: 'Loading spinner' },
    { name: 'Pen', component: PenIcon, description: 'Edit and write' },
    { name: 'Book', component: BookIcon, description: 'Documentation' },
    { name: 'Desktop', component: DesktopIcon, description: 'Computer and display' },
    { name: 'Calendar', component: CalendarIcon, description: 'Dates and scheduling' },
    { name: 'Checklist', component: ChecklistIcon, description: 'Tasks and todos' },
    { name: 'Clock', component: ClockIcon, description: 'Time and duration' },
    { name: 'Code Arrows', component: CodeArrowsIcon, description: 'Development' },
    { name: 'Grid', component: GridIcon, description: 'Layout and structure' },
    { name: 'Books', component: BooksIcon, description: 'Library and resources' },
    { name: 'Sticky Note', component: StickyNoteIcon, description: 'Notes and reminders' },
    { name: 'Progress Bar', component: ProgressBarIcon, description: 'Progress tracking' },
    { name: 'Graph', component: GraphIcon, description: 'Charts and data' },
    { name: 'Sync', component: SyncIcon, description: 'Synchronization' },
    { name: 'Database', component: DatabaseIcon, description: 'Data storage' },
    { name: 'API Nodes', component: ApiNodesIcon, description: 'API connections' },
    { name: 'Cloud', component: CloudIcon, description: 'Cloud services' },
  ];

  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '40px', color: 'var(--text-primary)' }}>
        Custom Icon Library
      </h1>
      <p style={{ textAlign: 'center', marginBottom: '40px', color: 'var(--text-secondary)' }}>
        All icons are custom-designed SVGs with consistent styling, gradients, and project-specific theming.
      </p>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: '20px' 
      }}>
        {icons.map(({ name, component: IconComponent, description }) => (
          <div
            key={name}
            style={{
              background: 'var(--surface-color)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '20px',
              textAlign: 'center',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--primary-color)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-color)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <div style={{ marginBottom: '16px' }}>
              <IconComponent size={48} />
            </div>
            <h3 style={{ 
              margin: '0 0 8px 0', 
              fontSize: '16px', 
              fontWeight: '600',
              color: 'var(--text-primary)' 
            }}>
              {name}
            </h3>
            <p style={{ 
              margin: '0', 
              fontSize: '14px', 
              color: 'var(--text-secondary)',
              lineHeight: '1.4'
            }}>
              {description}
            </p>
          </div>
        ))}
      </div>
      
      <div style={{ 
        marginTop: '60px', 
        padding: '30px', 
        background: 'var(--primary-color-light)', 
        borderRadius: '12px',
        textAlign: 'center'
      }}>
        <h2 style={{ color: 'var(--primary-color)', marginBottom: '16px' }}>
          Icon Features
        </h2>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '20px',
          marginTop: '20px'
        }}>
          <div>
            <h4 style={{ color: 'var(--primary-color)', marginBottom: '8px' }}>🎨 Custom Gradients</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>
              Each icon uses project-specific color gradients
            </p>
          </div>
          <div>
            <h4 style={{ color: 'var(--primary-color)', marginBottom: '8px' }}>📐 Consistent Sizing</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>
              All icons support flexible sizing with proper proportions
            </p>
          </div>
          <div>
            <h4 style={{ color: 'var(--primary-color)', marginBottom: '8px' }}>🌙 Theme Support</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>
              Icons adapt to light and dark themes automatically
            </p>
          </div>
          <div>
            <h4 style={{ color: 'var(--primary-color)', marginBottom: '8px' }}>⚡ Optimized SVG</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>
              Lightweight, scalable, and performance-optimized
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IconShowcase;