/**
 * @since 2017-04-11 19:10:08
 * @author vivaxy
 */

import React, { PureComponent } from 'react';
import Image from 'react-native-android-image-polyfill';
import { StyleSheet, Dimensions } from 'react-native';
import PropTypes from 'prop-types';

import { getImageSizeFitWidth, getImageSizeFitWidthFromCache } from './cache';
import { NOOP, DEFAULT_HEIGHT } from './helpers';

// remove `resizeMode` props from `Image.propTypes`
const { resizeMode, ...ImagePropTypes } = Image.propTypes;

export default class AutoHeightImage extends PureComponent {
  static propTypes = {
    ...ImagePropTypes,
    maximumHeight: PropTypes.number,
    width: PropTypes.number.isRequired,
    onHeightChange: PropTypes.func
  };

  static defaultProps = {
    onHeightChange: NOOP
  };

  constructor(props) {
    super(props);
    this.setInitialImageHeight();
  }

  updateSequence = 0;

  async componentDidMount() {
    this.hasMounted = true;
    await this.updateImageHeight(this.props);
  }

  async componentDidUpdate() {
    await this.updateImageHeight(this.props);
  }

  componentWillUnmount() {
    this.hasMounted = false;
    // clear memory usage
    this.updateSequence = null;
  }

  setInitialImageHeight() {
    const { source, width, onHeightChange, isPortrait } = this.props;
    const { height = DEFAULT_HEIGHT } = getImageSizeFitWidthFromCache(
      source,
      width
    );

    this.state = { height };
    this.styles = StyleSheet.create({ image: { width, height } });
    onHeightChange(height);
  }

  async updateImageHeight(props) {
    if (
      this.state.height === DEFAULT_HEIGHT ||
      this.props.width !== props.width ||
      this.props.source !== props.source
    ) {
      // image height could not be `0`
      const { source, width, onHeightChange } = props;
      try {
        const updateSequence = ++this.updateSequence;
        const { height } = await getImageSizeFitWidth(source, width);
        if (updateSequence !== this.updateSequence) {
          return;
        }
        
        this.styles = StyleSheet.create({ image: { width, height } });
        if (this.hasMounted) {
          // guard `this.setState` to be valid
          this.setState({ height });
          onHeightChange(height);
        }
      } catch (ex) {
        if (this.props.onError) {
          this.props.onError(ex);
        }
      }
    }
  }

  render() {
    // remove `width` prop from `restProps`
    const { source, style, width, ...restProps } = this.props;
    var imgStyle = {width: this.styles.image.width, height: this.styles.image.height};
    if(this.styles.image.height >= this.props.maximumHeight) {
      console.log('true');
      imgStyle = {width: this.styles.image.width, height: this.props.maximumHeight};
    }
    return (
      <Image
        source={source}
        style={[this.styles.image, style]}
        {...restProps}
      />
    );
  }
}
