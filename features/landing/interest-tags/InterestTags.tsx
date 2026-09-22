'use client';

import React, { useState, useRef } from 'react'
import { Sparkles, X } from 'lucide-react'
import './interest-tags.scss'
import { useLocalStorage } from '@/hooks/useLocalStorage';

const InterestTags = () => {
  const [tags, setTags] = useLocalStorage<string[]>('interests', []);
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleContainerClick = () => {
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const newTag = inputValue.trim().toLowerCase();
      if (newTag && !tags.includes(newTag)) {
        setTags([...tags, newTag]);
      }
      setInputValue('');
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      // Remove the last tag when pressing backspace on an empty input
      setTags(tags.slice(0, -1));
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  // Adjust textarea height automatically based on content
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  return (
    <section className="interests-section">
      <div className="glass-card interests-section__card">
        <div className="interests-section__header">
          <h3 className="interests-section__title">
            <Sparkles className="interests-section__title-icon" />
            Your Interests
          </h3>
          <span className="interests-section__subtitle">Match based on vibes</span>
        </div>
        
        <div className="interests-section__container">
          <div 
            className="interests-section__input-wrapper"
            onClick={handleContainerClick}
          >
            {tags.map((tag, index) => (
              <div key={index} className="interests-section__tag interests-section__tag--primary">
                <span className="interests-section__tag-text">{tag}</span>
                <X 
                  className="interests-section__tag-close" 
                  onClick={(e) => {
                    e.stopPropagation();
                    removeTag(tag);
                  }}
                />
              </div>
            ))}
            <textarea
              ref={inputRef}
              className="interests-section__textarea"
              value={inputValue}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder={tags.length === 0 ? "Add your interests (e.g. gaming, music)..." : ""}
              aria-label="Describe your interests"
              rows={1}
            />
          </div>
          <div className="interests-section__info">
            Press Enter or comma to add an interest
          </div>
        </div>
      </div>
    </section>
  )
}

export default InterestTags
