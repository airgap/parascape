import '@cloudscape-design/global-styles/index.css';
import { createRoot } from 'react-dom/client';
import Popover from '@cloudscape-design/components/popover';
import Modal from '@cloudscape-design/components/modal';

function App() {
	return (
		<div
			id="stage"
			style={{
				width: 520,
				background: '#fff',
				padding: 48,
				fontFamily:
					"'Open Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif",
			}}
		>
			<Popover
				header="Popover header"
				dismissButton
				triggerType="text"
				content={
					<p style={{ margin: 0 }}>
						This is the popover body content. It can contain <strong>rich</strong> text and multiple
						lines to exercise the body / header-row / content layout.
					</p>
				}
			>
				Trigger
			</Popover>
			<Modal visible={true} header="Modal title" onDismiss={() => {}} footer={<button>OK</button>}>
				Modal body content goes here.
			</Modal>
		</div>
	);
}

createRoot(document.getElementById('root')!).render(<App />);
