import './PageShell.css';

/**
 * PageShell — Structural layout for every main screen.
 *
 * Usage:
 *   <PageShell header={<YourHeaderJSX />}>
 *     {scrollable page content}
 *   </PageShell>
 *
 * The `header` prop renders in a fixed bar that NEVER scrolls.
 * The `children` render in the only scrollable region on screen.
 * The bottom navigation is fixed independently via BottomNavigation.css.
 */
const PageShell = ({ header, children, className = '' }) => {
    return (
        <div className="page-shell">
            {header && (
                <div className="page-top-bar">
                    {header}
                </div>
            )}
            <div className={`page-scroll-body ${className}`}>
                {children}
            </div>
        </div>
    );
};

export default PageShell;
