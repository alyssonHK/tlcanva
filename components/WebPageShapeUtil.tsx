import { BaseBoxShapeUtil, HTMLContainer, T, Rectangle2d } from '@tldraw/tldraw';
import React from 'react';
import { InteractiveWebPage } from './InteractiveWebPage';

export class WebPageShapeUtil extends BaseBoxShapeUtil<any> {
  static override type = 'web-page' as const;

  static override props = {
    w: T.number,
    h: T.number,
  url: T.string,
  };

  override canResize = () => true;
  override canBind = () => false;

  override getDefaultProps() {
    return {
      w: 600,
      h: 400,
  url: '',
    };
  }

  override getGeometry(shape: any) {
    return new Rectangle2d({
      width: shape.props.w,
      height: shape.props.h,
      x: 0,
      y: 0,
      isFilled: true,
    });
  }

  override component(shape: any): React.ReactNode {
    return (
      <HTMLContainer
        id={shape.id}
        style={{
          overflow: 'hidden',
          backgroundColor: '#fff',
          border: '1px solid #4A5568',
          borderRadius: '8px',
          pointerEvents: 'all',
        }}
      >
        <InteractiveWebPage url={shape.props.url} width={shape.props.w} height={shape.props.h} />
      </HTMLContainer>
    );
  }

  override indicator(shape: any): React.ReactNode {
    return <rect width={shape.props.w} height={shape.props.h} />;
  }
}
