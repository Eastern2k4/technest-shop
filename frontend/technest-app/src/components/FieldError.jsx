export default function FieldError({ message, className = '', style }) {
  if (!message) {
    return null
  }

  return (
    <small
      className={className || 'error-msg'}
      style={style}
    >
      {message}
    </small>
  )
}
