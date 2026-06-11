import { JSX, useId } from 'react';
import styled from 'styled-components';
import { PanelBody, PanelTitle, SoftPanel } from '../../ui/QueryErrorState';

const TITLE = "This album isn't available";
const MESSAGE =
  'This link may have been turned off, or the album may no longer exist.';

export const PublicUnavailable = (): JSX.Element => {
  const titleId = useId();

  return (
    <Page>
      <UnavailablePanel role="alert">
        <PanelTitle id={titleId}>{TITLE}</PanelTitle>
        <PanelBody aria-labelledby={titleId}>{MESSAGE}</PanelBody>
      </UnavailablePanel>
    </Page>
  );
};

const Page = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  width: 100%;
  padding: ${({ theme }) => theme.spacing(3)};
  box-sizing: border-box;
  background: ${({ theme }) => theme.color.body};
`;

const UnavailablePanel = styled(SoftPanel)`
  border: 1px solid ${({ theme }) => theme.color.border};
  background: ${({ theme }) => theme.color.bodyRaised};
  color: ${({ theme }) => theme.color.bodyText};
  text-align: center;

  ${PanelTitle} {
    width: 100%;
    text-align: center;
  }

  ${PanelBody} {
    width: 100%;
    text-align: center;
  }
`;
