import React, { forwardRef } from 'react';
import { Form } from 'formik';
import styled from 'styled-components/macro';
import { breakpoint } from '@/theme';
import FlashMessageRender from '@/components/FlashMessageRender';
import tw from 'twin.macro';

type Props = React.DetailedHTMLProps<React.FormHTMLAttributes<HTMLFormElement>, HTMLFormElement> & {
    title?: string;
};

const Container = styled.div`
    ${tw`mx-auto px-4`};

    ${breakpoint('sm')`
        ${tw`w-full`}
    `};

    ${breakpoint('md')`
        ${tw`p-10`}
    `};

    ${breakpoint('lg')`
        ${tw`w-full`}
    `};

    ${breakpoint('xl')`
        ${tw`w-full`}
        max-width: 440px;
    `};
`;

export default forwardRef<HTMLFormElement, Props>(({ title, ...props }, ref) => (
    <Container>
        <div css={tw`text-center mb-6`}>
            <div css={tw`inline-flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-800 border border-neutral-600 text-cyan-300 text-xl font-semibold mb-4`}>
                F
            </div>
            {title && <h2 css={tw`text-2xl text-neutral-100 font-semibold`}>{title}</h2>}
            <p css={tw`text-sm text-neutral-400 mt-2`}>Sign in to manage your servers.</p>
        </div>
        <FlashMessageRender css={tw`mb-3 px-1`} />
        <Form {...props} ref={ref}>
            <div css={tw`w-full bg-neutral-800 border border-neutral-600 shadow-lg rounded-xl p-6 mx-1`}>
                {props.children}
            </div>
        </Form>
        <p css={tw`text-center text-neutral-500 text-xs mt-4`}>
            Fluid Panel &copy; {new Date().getFullYear()}
        </p>
    </Container>
));
