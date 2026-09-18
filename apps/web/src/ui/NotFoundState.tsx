import { JSX, useId } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { PanelBody, PanelTitle, SoftPanel } from './QueryErrorState';

const DEFAULT_TITLE = "This item isn't available";
/**
 * The API returns null both for ids that don't exist and for ids the viewer can't see
 * (so ids can't be probed). The copy covers both without confirming which one it is,
 * and without suggesting the app failed.
 */
const MESSAGE = 'It may have been removed, or you may not have access to it.';

type NotFoundStateProps = {
  title?: string;
};

/** In-shell state for a detail route whose queried entity came back null. */
export const NotFoundState = ({ title = DEFAULT_TITLE }: NotFoundStateProps): JSX.Element => {
  const titleId = useId();

  return (
    <Wrapper>
      <NotFoundPanel role="status" aria-labelledby={titleId}>
        <PanelTitle id={titleId}>{title}</PanelTitle>
        <PanelBody>{MESSAGE}</PanelBody>
        <LibraryLink to="/media">Back to library</LibraryLink>
      </NotFoundPanel>
    </Wrapper>
  );
};

const Wrapper = styled.div`
  width: 100%;
  padding: ${({ theme }) => theme.spacing(3)};
  box-sizing: border-box;
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

const LibraryLink = styled(Link)`
  display: inline-block;
  margin-top: ${({ theme }) => theme.spacing(2)};
  color: ${({ theme }) => theme.color.link};
  font-size: 0.875rem;
  text-decoration: underline;

  &:hover {
    color: ${({ theme }) => theme.color.linkHover};
  }
`;
