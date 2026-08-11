import React, { forwardRef } from 'react';
import { Form } from 'formik';
import styled from 'styled-components/macro';
import { breakpoint } from '@/theme';
import FlashMessageRender from '@/components/FlashMessageRender';
import tw from 'twin.macro';

type Props = React.DetailedHTMLProps<React.FormHTMLAttributes<HTMLFormElement>, HTMLFormElement> & {
    title?: string;
    subtitle?: string;
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

const FormCard = styled.div`
    ${tw`w-full bg-neutral-800 border border-neutral-600 shadow-lg rounded-xl p-6 mx-1`};

    label {
        color: #cbd5e1 !important;
    }

    input:not([type='checkbox']):not([type='radio']) {
        background: #141923 !important;
        border-color: #374151 !important;
        color: #f3f4f6 !important;
        box-shadow: none !important;
    }

    input:not([type='checkbox']):not([type='radio']):hover {
        border-color: #4b5563 !important;
    }

    input:not([type='checkbox']):not([type='radio']):focus {
        border-color: #0891b2 !important;
        box-shadow: 0 0 0 3px rgba(8, 145, 178, 0.16) !important;
    }

    input::placeholder {
        color: #7d899a !important;
        opacity: 1 !important;
    }
`;

export default forwardRef<HTMLFormElement, Props>(({ title, subtitle = 'Sign in to manage your servers.', ...props }, ref) => (
    <Container>
        <div css={tw`text-center mb-6`}>
            <img
                src={'/favicons/flux_logo.jpg'}
                alt={'Fluid'}
                css={tw`inline-block h-14 w-14 rounded-xl object-cover border border-neutral-600 mb-4`}
            />
            {title && <h2 css={tw`text-2xl text-neutral-100 font-semibold`}>{title}</h2>}
            <p css={tw`text-sm text-neutral-400 mt-2`}>{subtitle}</p>
        </div>
        <FlashMessageRender css={tw`mb-3 px-1`} />
        <Form {...props} ref={ref}>
            <FormCard>{props.children}</FormCard>
        </Form>
        <p css={tw`text-center text-neutral-500 text-xs mt-4`}>
            Fluid Panel &copy; {new Date().getFullYear()}
        </p>
    </Container>
));
