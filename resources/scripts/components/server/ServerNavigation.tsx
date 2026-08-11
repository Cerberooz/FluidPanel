import * as React from 'react';
import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faAngleDoubleLeft,
    faArchive,
    faBars,
    faCalendarAlt,
    faCog,
    faDatabase,
    faExternalLinkAlt,
    faFolderOpen,
    faHistory,
    faLayerGroup,
    faNetworkWired,
    faRocket,
    faTerminal,
    faTimes,
    faUsers,
} from '@fortawesome/free-solid-svg-icons';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import Can from '@/components/elements/Can';
import Tooltip from '@/components/elements/tooltip/Tooltip';
import routes from '@/routers/routes';
import { usePersistedState } from '@/plugins/usePersistedState';

type Props = {
    baseUrl: string;
    serverName: string;
    serverId: number;
    rootAdmin: boolean;
};

const icons: Record<string, IconDefinition> = {
    Console: faTerminal,
    Files: faFolderOpen,
    Databases: faDatabase,
    Schedules: faCalendarAlt,
    Users: faUsers,
    Backups: faArchive,
    Network: faNetworkWired,
    Startup: faRocket,
    Settings: faCog,
    Activity: faHistory,
};

export default ({ baseUrl, serverName, serverId, rootAdmin }: Props) => {
    const [collapsed, setCollapsed] = usePersistedState('layout:server-sidebar:collapsed', false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const isCollapsed = !!collapsed;
    const to = (path: string) => (path === '/' ? baseUrl : `${baseUrl.replace(/\/*$/, '')}/${path.replace(/^\/+/, '')}`);

    return (
        <>
            <button
                type={'button'}
                aria-label={'Open server navigation'}
                onClick={() => setMobileOpen(true)}
                className={'fixed left-4 top-4 z-40 flex h-11 w-11 items-center justify-center rounded-xl border border-neutral-600 bg-neutral-900 text-neutral-200 shadow-lg lg:hidden'}
            >
                <FontAwesomeIcon icon={faBars} />
            </button>
            {mobileOpen && (
                <button
                    type={'button'}
                    aria-label={'Close server navigation'}
                    onClick={() => setMobileOpen(false)}
                    className={'fixed inset-0 z-30 bg-black/50 lg:hidden'}
                />
            )}
            <aside
                className={`fixed inset-y-0 left-0 z-40 flex overflow-hidden border-r border-neutral-600 bg-neutral-900 shadow-2xl transition-[width,transform] duration-200 lg:translate-x-0 ${
                    isCollapsed ? 'w-20' : 'w-64'
                } ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
            >
                <div className={'flex w-full min-w-0 flex-col p-4'}>
                    <div className={`flex min-w-0 items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
                        {!isCollapsed && (
                            <Link
                                to={'/'}
                                className={'min-w-0 truncate text-lg font-header font-semibold text-neutral-100 no-underline hover:text-white'}
                                title={'Back to dashboard'}
                            >
                                {serverName}
                            </Link>
                        )}
                        <button
                            type={'button'}
                            aria-label={isCollapsed ? 'Expand server navigation' : 'Collapse server navigation'}
                            onClick={() => setCollapsed((value) => !value)}
                            className={'hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-neutral-600 bg-neutral-900 text-neutral-300 transition-colors hover:bg-neutral-800 hover:text-neutral-100 lg:flex'}
                        >
                            <FontAwesomeIcon icon={faAngleDoubleLeft} className={isCollapsed ? 'rotate-180 transition-transform' : 'transition-transform'} />
                        </button>
                        <button
                            type={'button'}
                            aria-label={'Close server navigation'}
                            onClick={() => setMobileOpen(false)}
                            className={'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-neutral-600 bg-neutral-900 text-neutral-300 lg:hidden'}
                        >
                            <FontAwesomeIcon icon={faTimes} />
                        </button>
                    </div>

                    <nav className={'mt-6 flex flex-col gap-2'} aria-label={'Server management'}>
                        <Tooltip placement={isCollapsed ? 'right' : 'bottom'} content={'Dashboard'}>
                            <Link
                                to={'/'}
                                onClick={() => setMobileOpen(false)}
                                className={'flex h-11 items-center rounded-xl border border-transparent px-3 text-neutral-300 no-underline transition-all hover:border-neutral-600 hover:bg-neutral-800 hover:text-neutral-100'}
                            >
                                <FontAwesomeIcon icon={faLayerGroup} />
                                {!isCollapsed && <span className={'ml-3 whitespace-nowrap text-sm font-medium'}>Dashboard</span>}
                            </Link>
                        </Tooltip>
                        {routes.server
                            .filter((route) => !!route.name)
                            .map((route) => {
                                const link = (
                                    <NavLink
                                        to={to(route.path)}
                                        exact={route.exact}
                                        onClick={() => setMobileOpen(false)}
                                        className={'flex h-11 items-center rounded-xl border border-transparent px-3 text-neutral-300 no-underline transition-all hover:border-neutral-600 hover:bg-neutral-800 hover:text-neutral-100'}
                                        activeClassName={'border-neutral-600 bg-neutral-800 text-neutral-100'}
                                    >
                                        <FontAwesomeIcon icon={icons[route.name!] || faTerminal} />
                                        {!isCollapsed && <span className={'ml-3 whitespace-nowrap text-sm font-medium'}>{route.name}</span>}
                                    </NavLink>
                                );

                                return route.permission ? (
                                    <Can key={route.path} action={route.permission} matchAny>
                                        <Tooltip placement={isCollapsed ? 'right' : 'bottom'} content={route.name!}>
                                            {link}
                                        </Tooltip>
                                    </Can>
                                ) : (
                                    <Tooltip key={route.path} placement={isCollapsed ? 'right' : 'bottom'} content={route.name!}>
                                        {link}
                                    </Tooltip>
                                );
                            })}
                    </nav>

                    {rootAdmin && (
                        <div className={'mt-auto'}>
                            <Tooltip placement={isCollapsed ? 'right' : 'bottom'} content={'Open admin server view'}>
                                <a
                                    href={`/admin/servers/view/${serverId}`}
                                    target={'_blank'}
                                    rel={'noreferrer'}
                                    className={'flex h-11 items-center rounded-xl border border-transparent px-3 text-neutral-300 no-underline transition-all hover:border-neutral-600 hover:bg-neutral-800 hover:text-neutral-100'}
                                >
                                    <FontAwesomeIcon icon={faExternalLinkAlt} />
                                    {!isCollapsed && <span className={'ml-3 whitespace-nowrap text-sm font-medium'}>Admin view</span>}
                                </a>
                            </Tooltip>
                        </div>
                    )}
                </div>
            </aside>
            <div className={`hidden shrink-0 transition-[width] duration-200 lg:block ${isCollapsed ? 'w-20' : 'w-64'}`} />
        </>
    );
};
