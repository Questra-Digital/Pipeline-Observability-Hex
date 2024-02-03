const TextAtom = ({children, properties, text}) => {
  return (
    <p className={`${properties}`}>
      {text}{children}
    </p>
  )
}

export default TextAtom