import { JSX, useId } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { PanelBody, PanelTitle, SoftPanel } from '../ui/QueryErrorState';

const TITLE = 'Page not found';
const MESSAGE = "The page you're looking for doesn't exist or may have moved.";

export const NotFoundScreen = (): JSX.Element => {
  const titleId = useId();

  return (
    <Page>
      <NotFoundPanel role="alert">
        <PanelTitle id={titleId}>{TITLE}</PanelTitle>
        <PanelBody aria-labelledby={titleId}>{MESSAGE}</PanelBody>
        <HomeLink to="/">Go home</HomeLink>
      </NotFoundPanel>
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

const NotFoundPanel = styled(SoftPanel)`
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

const HomeLink = styled(Link)`
  display: inline-block;
  margin-top: ${({ theme }) => theme.spacing(2)};
  color: ${({ theme }) => theme.color.link};
  font-size: 0.875rem;
  text-decoration: underline;

  &:hover {
    color: ${({ theme }) => theme.color.linkHover};
  }
`;
