import { useState, useRef, useEffect } from "react";
import styled, { keyframes } from "styled-components";
import {
    HiOutlineEnvelope,
    HiOutlineUser,
    HiOutlineChatBubbleLeftRight,
    HiOutlinePaperAirplane,
    HiCheck,
} from "react-icons/hi2";
import { media } from "../../utils/constants";
import toast from "react-hot-toast";

const fadeIn = keyframes`
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
`;

const Section = styled.section`
    padding: 4rem 4rem;
    max-width: 100rem;
    margin: 0 auto;

    ${media.tablet} {
        padding: 3rem 2rem;
    }

    ${media.mobile} {
        padding: 2rem 1.5rem;
    }
`;

const SectionTitle = styled.h2`
    font-size: 2.4rem;
    color: var(--primary-text-color);
    margin-bottom: 0.5rem;
    text-align: center;

    ${media.tablet} {
        font-size: 2rem;
    }
`;

const SectionSubtitle = styled.p`
    font-size: 1.5rem;
    color: var(--secondary-text-color);
    text-align: center;
    margin-bottom: 3rem;

    ${media.tablet} {
        font-size: 1.3rem;
        margin-bottom: 2rem;
    }
`;

const FormContainer = styled.div`
    background-color: var(--color-grey-0);
    border: 1px solid var(--secondary-border-color);
    border-radius: var(--border-radius-lg);
    padding: 3rem;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    animation: ${fadeIn} 0.6s ease-out;

    ${media.tablet} {
        padding: 2rem;
    }

    ${media.mobile} {
        padding: 1.5rem;
    }
`;

const Form = styled.form`
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
`;

const FormRow = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;

    ${media.mobile} {
        grid-template-columns: 1fr;
    }
`;

const FormGroup = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
`;

const Label = styled.label`
    font-size: 1.4rem;
    font-weight: 500;
    color: var(--primary-text-color);
    display: flex;
    align-items: center;
    gap: 0.6rem;

    & svg {
        font-size: 1.6rem;
        color: var(--primary-button-color);
    }
`;

const Input = styled.input`
    padding: 1.2rem 1.4rem;
    font-size: 1.4rem;
    border: 1px solid var(--primary-border-color);
    border-radius: var(--border-radius-md);
    background-color: var(--primary-background-color);
    color: var(--primary-text-color);
    transition: border-color 0.2s ease, box-shadow 0.2s ease;

    &:focus {
        outline: none;
        border-color: var(--primary-button-color);
        box-shadow: 0 0 0 3px var(--primary-button-color-transparent);
    }

    &::placeholder {
        color: var(--color-grey-400);
    }
`;

const Select = styled.select`
    padding: 1.2rem 1.4rem;
    font-size: 1.4rem;
    border: 1px solid var(--primary-border-color);
    border-radius: var(--border-radius-md);
    background-color: var(--primary-background-color);
    color: var(--primary-text-color);
    cursor: pointer;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;

    &:focus {
        outline: none;
        border-color: var(--primary-button-color);
        box-shadow: 0 0 0 3px var(--primary-button-color-transparent);
    }
`;

const Textarea = styled.textarea`
    padding: 1.2rem 1.4rem;
    font-size: 1.4rem;
    border: 1px solid var(--primary-border-color);
    border-radius: var(--border-radius-md);
    background-color: var(--primary-background-color);
    color: var(--primary-text-color);
    min-height: 15rem;
    resize: vertical;
    font-family: inherit;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;

    &:focus {
        outline: none;
        border-color: var(--primary-button-color);
        box-shadow: 0 0 0 3px var(--primary-button-color-transparent);
    }

    &::placeholder {
        color: var(--color-grey-400);
    }
`;

// Honeypot field - hidden from users, visible to bots
const HoneypotField = styled.input`
    position: absolute;
    left: -9999px;
    opacity: 0;
    height: 0;
    width: 0;
    pointer-events: none;
`;

const SubmitButton = styled.button`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.8rem;
    padding: 1.4rem 2.4rem;
    font-size: 1.6rem;
    font-weight: 600;
    color: var(--primary-button-color-text);
    background: linear-gradient(
        135deg,
        var(--primary-button-color) 0%,
        var(--primary-button-color-hover) 100%
    );
    border: none;
    border-radius: var(--border-radius-md);
    cursor: pointer;
    transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease;
    align-self: flex-end;

    &:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }

    &:active:not(:disabled) {
        transform: translateY(0);
    }

    &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    & svg {
        font-size: 2rem;
    }

    ${media.mobile} {
        width: 100%;
    }
`;

const SupportEmail = styled.div`
    margin-top: 2rem;
    padding-top: 2rem;
    border-top: 1px solid var(--primary-border-color);
    text-align: center;
    color: var(--secondary-text-color);
    font-size: 1.3rem;

    & a {
        color: var(--primary-button-color);
        font-weight: 500;
        text-decoration: none;
        transition: color 0.2s ease;

        &:hover {
            text-decoration: underline;
        }
    }
`;

const SuccessMessage = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4rem 2rem;
    text-align: center;
    gap: 1.5rem;
    animation: ${fadeIn} 0.4s ease-out;
`;

const SuccessIcon = styled.div`
    width: 6rem;
    height: 6rem;
    border-radius: 50%;
    background: linear-gradient(
        135deg,
        var(--color-green-100) 0%,
        var(--color-green-200) 100%
    );
    display: flex;
    align-items: center;
    justify-content: center;

    & svg {
        font-size: 3rem;
        color: var(--color-green-600);
    }
`;

const SuccessTitle = styled.h3`
    font-size: 2rem;
    color: var(--primary-text-color);
    margin: 0;
`;

const SuccessText = styled.p`
    font-size: 1.4rem;
    color: var(--secondary-text-color);
    margin: 0;
    max-width: 40rem;
`;

const SUBJECT_OPTIONS = [
    { value: "", label: "Select a subject..." },
    { value: "general", label: "General Inquiry" },
    { value: "bug", label: "Bug Report" },
    { value: "feature", label: "Feature Request" },
    { value: "account", label: "Account Issues" },
    { value: "feedback", label: "Feedback" },
    { value: "other", label: "Other" },
];

const MIN_SUBMISSION_TIME = 3000; // Minimum 3 seconds to fill form (anti-bot)

function ContactForm({ id }) {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        subject: "",
        message: "",
        honeypot: "", // Spam protection
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const formLoadTime = useRef(Date.now());

    // Reset form load time when component mounts
    useEffect(() => {
        formLoadTime.current = Date.now();
    }, []);

    function handleChange(e) {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    }

    async function handleSubmit(e) {
        e.preventDefault();

        // Spam check 1: Honeypot field filled = bot
        if (formData.honeypot) {
            // Silently "succeed" to not alert bot
            setIsSubmitted(true);
            return;
        }

        // Spam check 2: Form submitted too quickly = bot
        const timeTaken = Date.now() - formLoadTime.current;
        if (timeTaken < MIN_SUBMISSION_TIME) {
            toast.error("Please take your time filling out the form");
            return;
        }

        // Validation
        if (!formData.name.trim()) {
            toast.error("Please enter your name");
            return;
        }

        if (!formData.email.trim() || !formData.email.includes("@")) {
            toast.error("Please enter a valid email address");
            return;
        }

        if (!formData.subject) {
            toast.error("Please select a subject");
            return;
        }

        if (!formData.message.trim() || formData.message.trim().length < 10) {
            toast.error("Please enter a message (at least 10 characters)");
            return;
        }

        setIsSubmitting(true);

        try {
            // For now, use mailto as fallback - can be replaced with Edge Function
            const mailtoLink = `mailto:support@kickerapp.dev?subject=${encodeURIComponent(
                `[${formData.subject}] Contact from ${formData.name}`
            )}&body=${encodeURIComponent(
                `Name: ${formData.name}\nEmail: ${formData.email}\nSubject: ${formData.subject}\n\nMessage:\n${formData.message}`
            )}`;

            window.location.href = mailtoLink;

            // Show success after a short delay
            setTimeout(() => {
                setIsSubmitted(true);
                setIsSubmitting(false);
            }, 500);
        } catch (error) {
            toast.error("Failed to send message. Please try again.");
            setIsSubmitting(false);
        }
    }

    function handleReset() {
        setFormData({
            name: "",
            email: "",
            subject: "",
            message: "",
            honeypot: "",
        });
        setIsSubmitted(false);
        formLoadTime.current = Date.now();
    }

    return (
        <Section id={id}>
            <SectionTitle>Get in Touch</SectionTitle>
            <SectionSubtitle>
                Have a question or feedback? We&apos;d love to hear from you!
            </SectionSubtitle>

            <FormContainer>
                {isSubmitted ? (
                    <SuccessMessage>
                        <SuccessIcon>
                            <HiCheck />
                        </SuccessIcon>
                        <SuccessTitle>Message Sent!</SuccessTitle>
                        <SuccessText>
                            Thank you for reaching out. Your email client should
                            have opened with your message. If not, please send
                            your inquiry directly to support@kickerapp.dev
                        </SuccessText>
                        <SubmitButton type="button" onClick={handleReset}>
                            Send Another Message
                        </SubmitButton>
                    </SuccessMessage>
                ) : (
                    <Form onSubmit={handleSubmit}>
                        {/* Honeypot field - hidden from users */}
                        <HoneypotField
                            type="text"
                            name="honeypot"
                            value={formData.honeypot}
                            onChange={handleChange}
                            tabIndex={-1}
                            autoComplete="off"
                        />

                        <FormRow>
                            <FormGroup>
                                <Label htmlFor="contact-name">
                                    <HiOutlineUser />
                                    Name
                                </Label>
                                <Input
                                    type="text"
                                    id="contact-name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="Your name"
                                    required
                                />
                            </FormGroup>

                            <FormGroup>
                                <Label htmlFor="contact-email">
                                    <HiOutlineEnvelope />
                                    Email
                                </Label>
                                <Input
                                    type="email"
                                    id="contact-email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="your@email.com"
                                    required
                                />
                            </FormGroup>
                        </FormRow>

                        <FormGroup>
                            <Label htmlFor="contact-subject">
                                <HiOutlineChatBubbleLeftRight />
                                Subject
                            </Label>
                            <Select
                                id="contact-subject"
                                name="subject"
                                value={formData.subject}
                                onChange={handleChange}
                                required
                            >
                                {SUBJECT_OPTIONS.map((option) => (
                                    <option
                                        key={option.value}
                                        value={option.value}
                                    >
                                        {option.label}
                                    </option>
                                ))}
                            </Select>
                        </FormGroup>

                        <FormGroup>
                            <Label htmlFor="contact-message">
                                <HiOutlineEnvelope />
                                Message
                            </Label>
                            <Textarea
                                id="contact-message"
                                name="message"
                                value={formData.message}
                                onChange={handleChange}
                                placeholder="Tell us what's on your mind..."
                                required
                            />
                        </FormGroup>

                        <SubmitButton type="submit" disabled={isSubmitting}>
                            <HiOutlinePaperAirplane />
                            {isSubmitting ? "Sending..." : "Send Message"}
                        </SubmitButton>
                    </Form>
                )}

                <SupportEmail>
                    Or email us directly at{" "}
                    <a href="mailto:support@kickerapp.dev">
                        support@kickerapp.dev
                    </a>
                </SupportEmail>
            </FormContainer>
        </Section>
    );
}

export default ContactForm;
