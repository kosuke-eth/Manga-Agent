import { 
    Geometry2d,
	HTMLContainer,
	RecordProps,
	Rectangle2d,
	ShapeUtil,
	T,
	TLBaseShape,
	TLResizeInfo,
	resizeBox,
	Ellipse2d,
} from "tldraw"
import { TextLabelVertical } from './SpeechTextLabel'

type BorderStyle = 'none' | 'round' | 'rectangle'
type ICustomShape = TLBaseShape<
	'speech-text',
	{
		w: number
		h: number
		text: string
		isVertical: boolean
		borderStyle: BorderStyle
	}
>

// [2]
export class SpeechTextUtil extends ShapeUtil<ICustomShape> {
	// [a]
	static override type = 'speech-text' as const
	static override props: RecordProps<ICustomShape> = {
		w: T.number,
		h: T.number,
		text: T.string,
		isVertical: T.boolean,
		borderStyle: T.any
	}

	// [b]
	getDefaultProps(): ICustomShape['props'] {
		return {
			w: 100,
			h: 300,
			text: '縦書きテキスト',
			isVertical: true,
			borderStyle: 'none',
		}
	}

	// [c]
	override canEdit() {
		return true
	}
	override canResize() {
		return true
	}
	override isAspectRatioLocked() {
		return false
	}

	// [d]
	getGeometry(shape: ICustomShape): Geometry2d {
		if (shape.props.borderStyle === 'round') {
			return new Ellipse2d({
				width: shape.props.w,
				height: shape.props.h,
				isFilled: false,
			})
		}
		return new Rectangle2d({
			width: shape.props.w,
			height: shape.props.h,
			isFilled: false,
		})
	}

	// [e]
	override onResize(shape: any, info: TLResizeInfo<any>) {
		return resizeBox(shape, info)
	}

	// [f]
	component(shape: ICustomShape) {
		const isRound = shape.props.borderStyle === 'round'
		const isRectangle = shape.props.borderStyle === 'rectangle'

		return (
			<HTMLContainer>
				<div style={{
					width: '100%',
					height: '100%',
					position: 'relative',
					pointerEvents: 'all'
				}}>
					{(isRound || isRectangle) && (
						<svg
							className="tl-svg-container" 
							width="100%"
							height="100%"
							style={{
								position: 'absolute',
								top: 0,
								left: 0,
								pointerEvents: 'all'
							}}
						>
							{isRound ? (
								<ellipse
									cx="50%"
									cy="50%"
									rx="49%"
									ry="49%"
									fill="white"
									stroke="black"
									strokeWidth="3"
									style={{ pointerEvents: 'all' }}
								/>
							) : (
								<rect
									x="0"
									y="0"
									width="100%"
									height="100%"
									fill="white"
									stroke="black"
									strokeWidth="3"
									style={{ pointerEvents: 'all' }}
								/>
							)}
						</svg>
					)}
					<TextLabelVertical
						shapeId={shape.id}
						type={SpeechTextUtil.type}
						text={shape.props.text}
						labelColor="#000000"
						isSelected={false}
						isVertical={shape.props.isVertical}
						style={{
							width: '100%',
							height: '100%',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							position: 'relative',
							zIndex: 1,
							pointerEvents: 'all'
						}}
					/>
				</div>
			</HTMLContainer>
		)
	}

	indicator(shape: ICustomShape) {
		if (shape.props.borderStyle === 'round') {
			return <ellipse
				cx={shape.props.w / 2}
				cy={shape.props.h / 2}
				rx={shape.props.w / 2}
				ry={shape.props.h / 2}
			/>
		}
		return <rect width={shape.props.w} height={shape.props.h} />
	}
}

