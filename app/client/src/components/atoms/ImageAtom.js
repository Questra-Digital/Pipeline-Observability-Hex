import Image from "next/image";


const ImageAtom = ({src, width, height, alt, loading, quality, priority, properties}) => {

  const additionalClasses = properties ? properties.join(' ') : '';

  return (
    <Image
    className={`  ${additionalClasses}`}
    src={src}
    width={width}
    height={height}
    alt={alt}
    loading={loading}
    quality={quality}
    priority={priority}
  />
  )
}

export default ImageAtom