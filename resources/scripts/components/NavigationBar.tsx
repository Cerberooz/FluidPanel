import * as React from 'react';
import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAngleDoubleLeft, faBars, faCogs, faLayerGroup, faSignOutAlt, faTimes } from '@fortawesome/free-solid-svg-icons';
import { useStoreState } from 'easy-peasy';
import { ApplicationStore } from '@/state';
import SearchContainer from '@/components/dashboard/search/SearchContainer';
import tw from 'twin.macro';
import styled from 'styled-components/macro';
import http from '@/api/http';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import Tooltip from '@/components/elements/tooltip/Tooltip';
import Avatar from '@/components/Avatar';
import { usePersistedState } from '@/plugins/usePersistedState';

const NavigationGroup = styled.div`
    & > a,
    & > button,
    & > .navigation-link {
        ${tw`flex items-center h-11 w-full no-underline text-neutral-300 px-3 cursor-pointer transition-all duration-150 rounded-xl border border-transparent`};

        &:active,
        &:hover {
            ${tw`text-neutral-100 bg-neutral-800 border-neutral-600`};
        }

        &:active,
        &:hover,
        &.active {
            ${tw`bg-neutral-800 border-neutral-600 text-neutral-100`};
        }
    }
`;

const Label = styled.span<{ $collapsed: boolean }>`
    ${tw`ml-3 text-sm font-medium whitespace-nowrap overflow-hidden transition-all duration-200`};
    width: ${({ $collapsed }) => ($collapsed ? '0' : 'auto')};
    opacity: ${({ $collapsed }) => ($collapsed ? 0 : 1)};
`;

const SidebarButton = styled.button`
    ${tw`flex items-center justify-center h-10 w-10 rounded-xl border border-neutral-600 bg-neutral-900 text-neutral-300 transition-all duration-150`};

    &:hover {
        ${tw`bg-neutral-800 text-neutral-100`};
    }
`;

export default () => {
    const name = useStoreState((state: ApplicationStore) => state.settings.data!.name);
    const rootAdmin = useStoreState((state: ApplicationStore) => state.user.data!.rootAdmin);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [collapsed, setCollapsed] = usePersistedState('layout:sidebar:collapsed', false);
    const [mobileOpen, setMobileOpen] = useState(false);

    const onTriggerLogout = () => {
        setIsLoggingOut(true);
        http.post('/auth/logout').finally(() => {
            // @ts-expect-error this is valid
            window.location = '/';
        });
    };

    const navCollapsed = !!collapsed;

    return (
        <>
            <SpinnerOverlay visible={isLoggingOut} />
            <button
                type={'button'}
                onClick={() => setMobileOpen(true)}
                className={'fixed left-4 top-4 z-40 flex h-11 w-11 items-center justify-center rounded-xl border border-neutral-600 bg-neutral-900 text-neutral-200 shadow-lg lg:hidden'}
            >
                <FontAwesomeIcon icon={faBars} />
            </button>
            {mobileOpen && (
                <button
                    type={'button'}
                    aria-label={'Close navigation'}
                    onClick={() => setMobileOpen(false)}
                    className={'fixed inset-0 z-30 bg-black/50 lg:hidden'}
                />
            )}
            <aside
                className={`fixed inset-y-0 left-0 z-40 flex border-r border-neutral-600 bg-neutral-900/95 shadow-2xl backdrop-blur transition-all duration-300 ${
                    mobileOpen ? 'translate-x-0 w-72' : '-translate-x-full w-72'
                } ${navCollapsed ? 'lg:w-20' : 'lg:w-72'} lg:translate-x-0`}
            >
                <div className={'flex w-full flex-col p-4'}>
                    <div className={'flex items-center justify-between'}>
                        <Link
                            to={'/'}
                            onClick={() => setMobileOpen(false)}
                            className={`inline-flex items-center overflow-hidden text-xl font-header font-semibold no-underline text-neutral-100 transition-all duration-200 ${
                                navCollapsed ? 'gap-0' : 'gap-3'
                            }`}
                        >
                            <img
                                src={'/favicons/flux_logo.jpg'}
                                alt={'Fluid'}
                                className={'h-10 w-10 shrink-0 rounded-xl border border-neutral-600 object-cover'}
                            />
                            <Label $collapsed={navCollapsed}>{name}</Label>
                        </Link>
                        <div className={'flex items-center gap-2'}>
                            <div className={'hidden lg:block'}>
                                <SidebarButton type={'button'} onClick={() => setCollapsed((value) => !value)}>
                                    <FontAwesomeIcon
                                        icon={faAngleDoubleLeft}
                                        className={`transition-transform duration-200 ${navCollapsed ? 'rotate-180' : ''}`}
                                    />
                                </SidebarButton>
                            </div>
                            <div className={'lg:hidden'}>
                                <SidebarButton type={'button'} onClick={() => setMobileOpen(false)}>
                                    <FontAwesomeIcon icon={faTimes} />
                                </SidebarButton>
                            </div>
                        </div>
                    </div>
                    <NavigationGroup className={'mt-6 flex flex-col gap-2'}>
                        <SearchContainer collapsed={navCollapsed} />
                        <Tooltip placement={navCollapsed ? 'right' : 'bottom'} content={'Dashboard'}>
                            <NavLink to={'/'} exact onClick={() => setMobileOpen(false)}>
                                <FontAwesomeIcon icon={faLayerGroup} />
                                <Label $collapsed={navCollapsed}>Dashboard</Label>
                            </NavLink>
                        </Tooltip>
                        {rootAdmin && (
                            <Tooltip placement={navCollapsed ? 'right' : 'bottom'} content={'Admin'}>
                                <a href={'/admin'} rel={'noreferrer'} onClick={() => setMobileOpen(false)}>
                                    <FontAwesomeIcon icon={faCogs} />
                                    <Label $collapsed={navCollapsed}>Admin</Label>
                                </a>
                            </Tooltip>
                        )}
                        <Tooltip placement={navCollapsed ? 'right' : 'bottom'} content={'Account Settings'}>
                            <NavLink to={'/account'} onClick={() => setMobileOpen(false)}>
                                <span className={'flex h-5 w-5 items-center'}>
                                    <Avatar.User size={20} />
                                </span>
                                <Label $collapsed={navCollapsed}>Account</Label>
                            </NavLink>
                        </Tooltip>
                    </NavigationGroup>
                    <div className={'mt-auto'}>
                        <NavigationGroup className={'flex flex-col gap-2'}>
                            <Tooltip placement={navCollapsed ? 'right' : 'bottom'} content={'Sign Out'}>
                                <button onClick={onTriggerLogout}>
                                    <FontAwesomeIcon icon={faSignOutAlt} />
                                    <Label $collapsed={navCollapsed}>Sign Out</Label>
                                </button>
                            </Tooltip>
                        </NavigationGroup>
                    </div>
                </div>
            </aside>
            <div className={`hidden shrink-0 transition-all duration-300 lg:block ${navCollapsed ? 'w-20' : 'w-72'}`} />
        </>
    );
};
