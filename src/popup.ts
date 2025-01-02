import './styles/tailwind.css'

// Add an event listener to the Sign-In link
document.addEventListener('DOMContentLoaded', () => {
  const link = document.querySelector('a')
  if (link) {
    link.addEventListener('click', (event) => {
      console.log('link clicked')
      event.preventDefault()
      const url = link.getAttribute('href') || ''
      chrome.tabs.create({ url })
    })
  }
})
