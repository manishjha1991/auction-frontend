import styled from "styled-components";

export const SoldPlayersContainer = styled.div`
  max-width: 800px;
  margin: 50px auto;
  background: linear-gradient(135deg, #1e3c72, #2a5298);
  border-radius: 15px;
  box-shadow: 0px 4px 20px rgba(0, 0, 0, 0.2);
  padding: 20px;
  color: #ffffff;
  font-family: 'Arial', sans-serif;
`;

export const Title = styled.h2`
  text-align: center;
  margin-bottom: 20px;
  font-size: 2rem;
  text-transform: uppercase;
  letter-spacing: 2px;
  border-bottom: 2px solid #ffffff;
  display: inline-block;
  padding-bottom: 10px;
`;

export const SearchBar = styled.input`
  width: 80%;
  padding: 10px;
  margin-bottom: 20px;
  border-radius: 20px;
  border: 1px solid #ccc;
  font-size: 0.9rem;
  box-shadow: 0px 3px 8px rgba(0, 0, 0, 0.1);
  outline: none;
  transition: all 0.3s ease;
  background: linear-gradient(135deg, #ffffff, #f8f8f8);

  &:focus {
    border-color: #2a5298;
    box-shadow: 0px 3px 15px rgba(42, 82, 152, 0.3);
  }

  &::placeholder {
    color: #aaa;
    font-style: italic;
  }
`;

export const FilterSelect = styled.select`
  width: 80%;
  padding: 10px;
  margin-bottom: 20px;
  border-radius: 20px;
  border: 1px solid #ccc;
  font-size: 0.9rem;
  box-shadow: 0px 3px 8px rgba(0, 0, 0, 0.1);
  outline: none;
  transition: all 0.3s ease;
  background: linear-gradient(135deg, #ffffff, #f8f8f8);

  &:focus {
    border-color: #2a5298;
    box-shadow: 0px 3px 15px rgba(42, 82, 152, 0.3);
  }
`;

export const PlayerList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

export const PlayerItem = styled.li`
  background: rgba(255, 255, 255, 0.1);
  margin: 10px 0;
  padding: 15px 20px;
  border-radius: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: scale(1.02);
    box-shadow: 0px 4px 15px rgba(0, 0, 0, 0.3);
  }

  span {
    cursor: pointer;
  }
`;

export const Modal = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: #ffffff;
  color: #000;
  border-radius: 15px;
  box-shadow: 0px 4px 20px rgba(0, 0, 0, 0.2);
  padding: 30px;
  width: 90%;
  max-width: 600px;
  z-index: 1000;
  font-family: 'Arial', sans-serif;
`;

export const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
`;

export const TabContainer = styled.div`
  display: flex;
  margin-bottom: 20px;
`;

export const Tab = styled.button`
  flex: 1;
  padding: 15px;
  background: ${(props) => (props.active ? "#2a5298" : "#e0e0e0")};
  color: ${(props) => (props.active ? "#fff" : "#000")};
  border: none;
  cursor: pointer;
  font-weight: bold;
  border-radius: 5px;
  margin: 0 5px;
  transition: background 0.3s ease;
  &:hover {
    background: ${(props) => (props.active ? "#1e3c72" : "#d6d6d6")};
  }
`;

export const Form = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

export const StyledInput = styled.input`
  padding: 15px;
  border: 1px solid #ccc;
  border-radius: 5px;
  font-size: 1rem;
  outline: none;
  transition: border-color 0.3s ease;
  &:focus {
    border-color: #2a5298;
  }
`;

export const StyledSelect = styled.select`
  padding: 15px;
  border: 1px solid #ccc;
  border-radius: 5px;
  font-size: 1rem;
  outline: none;
  transition: border-color 0.3s ease;
  &:focus {
    border-color: #2a5298;
  }
`;

export const SubmitButton = styled.button`
  padding: 15px;
  background: #28a745;
  color: #fff;
  border: none;
  border-radius: 5px;
  font-size: 1.2rem;
  cursor: pointer;
  font-weight: bold;
  transition: background 0.3s ease;
  &:hover {
    background: #218838;
  }
`;
