const TextAtom = ({children, properties, text}) => {
  return (
    <p className={`${properties} font-Ubuntu`}>
      {text}{children}
    </p>
  )
}

export default TextAtom