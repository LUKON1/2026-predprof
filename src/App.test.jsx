import { render, screen } from '@testing-library/react';
import App from './App';

describe('App Component', () => {
  it('renders Hackathon Starter heading', () => {
    // Рендерим компонент
    render(<App />);
    
    // Ищем заголовок по тексту (игнорируем регистр)
    const headingElement = screen.getByText(/hackathon starter/i);
    
    // Проверяем, что он есть в документе
    expect(headingElement).toBeInTheDocument();
  });

  it('renders Get Started button', () => {
    render(<App />);
    const buttonElement = screen.getByRole('button', { name: /get started/i });
    expect(buttonElement).toBeInTheDocument();
  });
});
