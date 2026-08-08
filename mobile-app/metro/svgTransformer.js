const svgTransformer = require('react-native-svg-transformer');

let baseTransformer;

try {
  baseTransformer = require('@expo/metro-config/babel-transformer');
} catch {
  baseTransformer = require('metro-react-native-babel-transformer');
}

module.exports.transform = async function transform(props) {
  if (props.filename && props.filename.endsWith('.svg')) {
    return svgTransformer.transform(props);
  }

  return baseTransformer.transform(props);
};
